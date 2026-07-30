import { GoogleGenAI } from '@google/genai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

const aiGemini = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null

export interface FallbackAIResponse {
  text: string | null
  functionCalls?: Array<{ name: string; args: any }> | null
}

// Provider-specific timeouts (in milliseconds)
const GEMINI_TIMEOUT = 15000
const GROQ_TIMEOUT = 15000
const OPENROUTER_TIMEOUT = 20000

async function withTimeout<T>(
  promiseFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  providerName: string
): Promise<T> {
  const controller = new AbortController()

  let timeoutId: any
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort()
      reject(new Error(`Timeout: ${providerName} failed to respond within ${timeoutMs}ms`))
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([
      promiseFn(controller.signal),
      timeoutPromise
    ])
    clearTimeout(timeoutId)
    return result
  } catch (err: any) {
    clearTimeout(timeoutId)
    throw err
  }
}

// Helper to recursively lowercase type fields in schema for OpenAI compatibility
function convertTypesToLowercase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertTypesToLowercase)
  } else if (obj !== null && typeof obj === 'object') {
    const res: any = {}
    for (const key of Object.keys(obj)) {
      if (key === 'type' && typeof obj[key] === 'string') {
        res[key] = obj[key].toLowerCase()
      } else {
        res[key] = convertTypesToLowercase(obj[key])
      }
    }
    return res
  }
  return obj
}

// Translations helpers
function translateHistoryToOpenAI(history: any[], systemInstruction: string): any[] {
  const messages: any[] = []
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction })
  }

  for (const item of history) {
    const role = item.role === 'model' ? 'assistant' : item.role

    // Process parts
    for (const part of item.parts || []) {
      if (part.text !== undefined) {
        messages.push({ role, content: part.text })
      } else if (part.functionCall) {
        messages.push({
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: `call_${part.functionCall.name}_0`,
            type: 'function',
            function: {
              name: part.functionCall.name,
              arguments: JSON.stringify(part.functionCall.args || {})
            }
          }]
        })
      } else if (part.functionCalls) {
        messages.push({
          role: 'assistant',
          content: null,
          tool_calls: part.functionCalls.map((fc: any, index: number) => ({
            id: `call_${fc.name}_${index}`,
            type: 'function',
            function: {
              name: fc.name,
              arguments: JSON.stringify(fc.args || {})
            }
          }))
        })
      } else if (part.functionResponse) {
        const name = part.functionResponse.name
        messages.push({
          role: 'tool',
          name,
          tool_call_id: `call_${name}_0`, // simplified correlation
          content: JSON.stringify(part.functionResponse.response ?? {})
        })
      }
    }
  }
  return messages
}

function translateToolsToOpenAI(geminiTools?: any[]): any[] | undefined {
  if (!geminiTools || geminiTools.length === 0) return undefined
  const declarations = geminiTools[0]?.functionDeclarations
  if (!declarations) return undefined

  return declarations.map((fd: any) => ({
    type: 'function',
    function: {
      name: fd.name,
      description: fd.description,
      parameters: convertTypesToLowercase(fd.parameters)
    }
  }))
}

function translateOpenAIResponse(data: any): FallbackAIResponse {
  const choice = data.choices?.[0]
  if (!choice) return { text: 'No response generated.' }

  const message = choice.message
  if (message.tool_calls && message.tool_calls.length > 0) {
    const functionCalls = message.tool_calls.map((tc: any) => ({
      name: tc.function.name,
      args: JSON.parse(tc.function.arguments || '{}')
    }))
    return {
      text: null,
      functionCalls
    }
  }

  return {
    text: message.content || '',
    functionCalls: null
  }
}

// Unified Fallback Generator
export async function generateAIContentWithFallback(params: {
  contents: string | any[]
  systemInstruction?: string
  tools?: any[]
}): Promise<FallbackAIResponse> {
  const isHistory = Array.isArray(params.contents)

  // 1. Try Gemini
  if (aiGemini) {
    try {
      console.log('[AI Fallback Wrapper] Attempting Gemini...')
      const response = await withTimeout(async (signal) => {
        // Native Google GenAI SDK doesn't natively accept AbortSignal directly, so we just wrap in withTimeout
        const geminiPromise = aiGemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            tools: params.tools
          }
        })
        return await geminiPromise
      }, GEMINI_TIMEOUT, 'Gemini')

      if (response) {
        return {
          text: response.text || '',
          functionCalls: response.functionCalls
        }
      }
    } catch (err: any) {
      console.warn(`[AI Fallback Wrapper] Gemini failed: ${err.message}. Trying Groq...`)
    }
  } else {
    console.warn('[AI Fallback Wrapper] Gemini API key not found. Trying Groq...')
  }

  // Translate formats for OpenAI compatibility
  const openAIMessages = isHistory
    ? translateHistoryToOpenAI(params.contents as any[], params.systemInstruction || '')
    : [
        ...(params.systemInstruction ? [{ role: 'system', content: params.systemInstruction }] : []),
        { role: 'user', content: params.contents as string }
      ]

  const openAITools = translateToolsToOpenAI(params.tools)

  // 2. Try Groq
  if (GROQ_API_KEY) {
    try {
      console.log('[AI Fallback Wrapper] Attempting Groq (llama-3.1-8b-instant)...')
      const response = await withTimeout(async (signal) => {
        const fetchRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: openAIMessages,
            ...(openAITools ? { tools: openAITools } : {}),
            temperature: 0.5,
            max_tokens: 1024
          }),
          signal
        })

        if (!fetchRes.ok) {
          const errMsg = await fetchRes.text()
          throw new Error(`Groq HTTP error ${fetchRes.status}: ${errMsg}`)
        }
        return await fetchRes.json()
      }, GROQ_TIMEOUT, 'Groq')

      if (response) {
        return translateOpenAIResponse(response)
      }
    } catch (err: any) {
      console.warn(`[AI Fallback Wrapper] Groq failed: ${err.message}. Trying OpenRouter...`)
    }
  } else {
    console.warn('[AI Fallback Wrapper] Groq API key not found. Trying OpenRouter...')
  }

  // 3. Try OpenRouter
  if (OPENROUTER_API_KEY) {
    try {
      console.log('[AI Fallback Wrapper] Attempting OpenRouter (meta-llama/llama-3.3-70b-instruct)...')
      const response = await withTimeout(async (signal) => {
        const fetchRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://kelalshop.com',
            'X-Title': 'KelalShop Admin'
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.3-70b-instruct',
            messages: openAIMessages,
            ...(openAITools ? { tools: openAITools } : {}),
            temperature: 0.5,
            max_tokens: 1024
          }),
          signal
        })

        if (!fetchRes.ok) {
          const errMsg = await fetchRes.text()
          throw new Error(`OpenRouter HTTP error ${fetchRes.status}: ${errMsg}`)
        }
        return await fetchRes.json()
      }, OPENROUTER_TIMEOUT, 'OpenRouter')

      if (response) {
        return translateOpenAIResponse(response)
      }
    } catch (err: any) {
      console.error(`[AI Fallback Wrapper] OpenRouter failed: ${err.message}`)
      throw new Error(`All AI providers failed: ${err.message}`)
    }
  } else {
    console.error('[AI Fallback Wrapper] OpenRouter API key not found.')
    throw new Error('All AI providers failed or are not configured.')
  }
}
