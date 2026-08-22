import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { checkRateLimit, generateDeviceFingerprint } from '@/lib/utils/security'

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const MAX_MESSAGE_LENGTH = 2000

const SYSTEM_PROMPT = `You are a helpful, friendly AI Support Assistant for KelalShop.
KelalShop is a multi-vendor ecommerce marketplace connecting Ethiopian buyers with verified shoppers (sellers) who import goods from Amazon, AliExpress, Shein, Temu, and local markets.

Key Information:
- Buyers can browse products, message shoppers directly, or post custom "Buyer Requests" if they can't find what they are looking for.
- Shoppers must be verified by admin before they can sell.
- Payments are arranged directly between buyer and shopper. Accepted methods on KelalShop: CBE Birr and Telebirr only (no card processing on the platform yet).
- If a user needs help with a specific order, advise them to check the "Orders" page in their Dashboard and use the Order Chat.
- Keep your answers concise, professional, and friendly (1-3 short paragraphs max).
- Do not use markdown other than simple bolding or bullet points. Do not write code.`

export async function POST(req: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase env vars')
      return NextResponse.json(
        { error: 'Server configuration error', reply: "I'm sorry, I'm having trouble connecting right now. Please try again later." },
        { status: 500 }
      )
    }

    const geminiApiKey = process.env.GEMINI_API_KEY
    const groqApiKey = process.env.GROQ_API_KEY

    if (!geminiApiKey && !groqApiKey) {
      return NextResponse.json(
        { error: 'AI service not configured', reply: "I'm sorry, the AI service is temporarily unavailable. Please try again later." },
        { status: 500 }
      )
    }

    const body = await req.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null
    const guestId = typeof body.guestId === 'string' ? body.guestId : null
    const clientUserId = typeof body.userId === 'string' ? body.userId : null

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: 'Message is too long' }, { status: 400 })
    }

    if (!guestId || guestId.length < 8 || guestId.length > 64) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }

    const serverSupabase = await createServerClient()
    const { data: { user } } = await serverSupabase.auth.getUser()
    const userId = user?.id ?? null

    if (clientUserId && clientUserId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { ip } = await generateDeviceFingerprint()
    const rateKey = userId ? `chat_user:${userId}` : `chat_guest:${guestId}`
    const ipAllowed = await checkRateLimit(`chat_ip:${ip}`, 30, 900)
    const keyAllowed = await checkRateLimit(rateKey, 40, 900)

    if (!ipAllowed || !keyAllowed) {
      return NextResponse.json(
        { error: 'Too many messages', reply: "You're sending messages too quickly. Please wait a moment and try again." },
        { status: 429 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let currentSessionId = sessionId

    if (currentSessionId) {
      const { data: existing } = await supabase
        .from('support_sessions')
        .select('user_id, guest_id')
        .eq('id', currentSessionId)
        .single()

      if (!existing) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      if (userId) {
        if (existing.user_id !== userId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      } else if (existing.guest_id !== guestId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      const { data: session, error: sessionError } = await supabase
        .from('support_sessions')
        .insert({ user_id: userId, guest_id: guestId, status: 'bot' })
        .select()
        .single()

      if (sessionError) {
        console.error('Session Error:', sessionError)
        return NextResponse.json(
          { error: 'Failed to create session', reply: "I'm sorry, I couldn't start a chat session. Please refresh and try again." },
          { status: 500 }
        )
      }
      currentSessionId = session.id
    }

    const { data: history } = await supabase
      .from('support_messages')
      .select('sender_type, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(15)

    await supabase.from('support_messages').insert({
      session_id: currentSessionId,
      sender_type: 'user',
      content: message,
    })

    const formattedHistory = (history || []).map(msg => ({
      role: msg.sender_type === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content,
    }))

    // --- AI: Try Gemini first, fall back to Groq ---
    let responseText: string | null = null

    // 1. Try Gemini (primary)
    if (geminiApiKey) {
      try {
        console.log('[Chat API] Attempting Gemini...')
        const geminiContents = [
          ...formattedHistory.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          { role: 'user', parts: [{ text: message }] },
        ]

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
              contents: geminiContents,
              generationConfig: { temperature: 0.5, maxOutputTokens: 512 },
            }),
          }
        )

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json()
          responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? null
          if (responseText) console.log('[Chat API] Gemini succeeded.')
        } else {
          const errBody = await geminiRes.text()
          console.warn('[Chat API] Gemini failed:', geminiRes.status, errBody)
        }
      } catch (err: any) {
        console.warn('[Chat API] Gemini exception:', err.message)
      }
    }

    // 2. Fall back to Groq if Gemini failed
    if (!responseText && groqApiKey) {
      try {
        console.log('[Chat API] Falling back to Groq (groq/compound-mini)...')
        const chatMessages = [
          { role: 'system' as const, content: SYSTEM_PROMPT },
          ...formattedHistory,
          { role: 'user' as const, content: message },
        ]

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'groq/compound-mini',
            messages: chatMessages,
            temperature: 0.5,
            max_tokens: 512,
          }),
        })

        if (groqRes.ok) {
          const groqData = await groqRes.json()
          responseText = groqData.choices?.[0]?.message?.content ?? null
          if (responseText) console.log('[Chat API] Groq succeeded.')
        } else {
          const errBody = await groqRes.text()
          console.error('[Chat API] Groq failed:', groqRes.status, errBody)
        }
      } catch (err: any) {
        console.error('[Chat API] Groq exception:', err.message)
      }
    }

    if (!responseText) {
      return NextResponse.json(
        { error: 'AI service error', reply: "I'm sorry, I'm having trouble thinking right now. Please try again in a moment." },
        { status: 502 }
      )
    }

    await supabase.from('support_messages').insert({
      session_id: currentSessionId,
      sender_type: 'bot',
      content: responseText,
    })

    return NextResponse.json({ sessionId: currentSessionId, reply: responseText, success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Chat API Error:', msg)
    return NextResponse.json(
      { error: 'Internal Server Error', reply: "I'm sorry, something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
