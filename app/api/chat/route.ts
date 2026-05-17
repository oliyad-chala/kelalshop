import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'

// Initialize Supabase admin client to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
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

    // 4. Build Groq messages array (system + history + new message)
    const formattedHistory = (history || []).map(msg => ({
      role: msg.sender_type === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }))

    const groqMessages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...formattedHistory,
      { role: 'user', content: message } // The new message from the user
    ]

    // Initialize Groq here to prevent Vercel build-time errors if key is missing during build
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_key_to_bypass_build' })

    // 5. Call Groq API with llama-3.3-70b-versatile
    const chatCompletion = await groq.chat.completions.create({
      messages: groqMessages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 512
    })

    const responseText = chatCompletion.choices[0]?.message?.content || "I'm sorry, I'm having trouble connecting right now."

    // 6. Save bot response to DB
    await supabase.from('support_messages').insert({
      session_id: currentSessionId,
      sender_type: 'bot',
      content: responseText
    })

    return NextResponse.json({ sessionId: currentSessionId, reply: responseText, success: true })
  } catch (error: any) {
    console.error('Chat API Error:', error?.message || error)
    return NextResponse.json({ error: 'Internal Server Error', details: error?.message }, { status: 500 })
  }
}
