import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force Node.js runtime (Groq SDK requires Node APIs not available in Edge)
export const runtime = 'nodejs'

// Initialize Supabase admin client to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const SYSTEM_PROMPT = `You are a helpful, friendly AI Support Assistant for KelalShop.
KelalShop is a multi-vendor ecommerce marketplace connecting Ethiopian buyers with verified shoppers (sellers) who import goods from Amazon, AliExpress, Shein, Temu, and local markets.

Key Information:
- Buyers can browse products, message shoppers directly, or post custom "Buyer Requests" if they can't find what they are looking for.
- Shoppers must be verified by admin before they can sell.
- Payments are secure. Accepted methods: CBE Birr, Telebirr, Mastercard, and Visa.
- If a user needs help with a specific order, advise them to check the "Orders" page in their Dashboard and use the Order Chat.
- Keep your answers concise, professional, and friendly (1-3 short paragraphs max).
- Do not use markdown other than simple bolding or bullet points. Do not write code.`

export async function POST(req: Request) {
  try {
    // --- Validate environment variables at runtime ---
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase env vars. NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl, 'SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
      return NextResponse.json(
        { error: 'Server configuration error', reply: "I'm sorry, I'm having trouble connecting right now. Please try again later." },
        { status: 500 }
      )
    }

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      console.error('GROQ_API_KEY is not set in environment variables')
      return NextResponse.json(
        { error: 'AI service not configured', reply: "I'm sorry, the AI service is temporarily unavailable. Please try again later." },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { message, sessionId, guestId, userId } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    let currentSessionId = sessionId

    // 1. Create a session if one doesn't exist yet
    if (!currentSessionId) {
      const { data: session, error: sessionError } = await supabase
        .from('support_sessions')
        .insert({ user_id: userId || null, guest_id: guestId || null, status: 'bot' })
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

    // 2. Fetch chat history BEFORE inserting new message (clean history for context)
    const { data: history } = await supabase
      .from('support_messages')
      .select('sender_type, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(15)

    // 3. Save the user's message to DB
    await supabase.from('support_messages').insert({
      session_id: currentSessionId,
      sender_type: 'user',
      content: message
    })

    // 4. Build messages array (system + history + new message)
    const formattedHistory = (history || []).map(msg => ({
      role: msg.sender_type === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }))

    const chatMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...formattedHistory,
      { role: 'user' as const, content: message }
    ]

    // 5. Call Groq API directly via fetch (avoids SDK edge/node compatibility issues on Vercel)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: chatMessages,
        temperature: 0.5,
        max_tokens: 512,
      }),
    })

    if (!groqResponse.ok) {
      const errBody = await groqResponse.text()
      console.error('Groq API error:', groqResponse.status, errBody)
      return NextResponse.json(
        { error: 'AI service error', reply: "I'm sorry, I'm having trouble thinking right now. Please try again in a moment." },
        { status: 502 }
      )
    }

    const groqData = await groqResponse.json()
    const responseText = groqData.choices?.[0]?.message?.content || "I'm sorry, I'm having trouble connecting right now."

    // 6. Save bot response to DB
    await supabase.from('support_messages').insert({
      session_id: currentSessionId,
      sender_type: 'bot',
      content: responseText
    })

    return NextResponse.json({ sessionId: currentSessionId, reply: responseText, success: true })
  } catch (error: any) {
    console.error('Chat API Error:', error?.message || error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error?.message, reply: "I'm sorry, something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
