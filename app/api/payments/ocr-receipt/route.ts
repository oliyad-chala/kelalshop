import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ tx_ref: null, error: 'OCR service not configured' }, { status: 500 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('receipt') as File | null

    if (!file || file.size === 0) {
      return NextResponse.json({ tx_ref: null, error: 'No image provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type || 'image/jpeg'

    const prompt =
      'Look at this Ethiopian payment receipt screenshot (CBE, Telebirr, Awash, or BOA) carefully. ' +
      'Extract ONLY the transaction reference number or transaction ID. ' +
      'For Commercial Bank of Ethiopia (CBE), the reference number starts with "FT" (e.g. FT24000..., FT25000..., FT26000...). ' +
      'For Telebirr, it is a numeric or alphanumeric transaction code. ' +
      'Return ONLY the raw ID string with no spaces, extra punctuation, or explanation. ' +
      'If you cannot find any transaction reference number, return the single word: null'

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType, data: base64 } },
              ],
            },
          ],
          generationConfig: { temperature: 0, maxOutputTokens: 128 },
        }),
      }
    )

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('[OCR] Gemini error:', geminiRes.status, errText)
      return NextResponse.json({ tx_ref: null, error: 'OCR failed' }, { status: 502 })
    }

    const data = await geminiRes.json()
    const rawText = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim()
    const cleaned = rawText.replace(/^["']|["']$/g, '').trim()
    const tx_ref = cleaned === 'null' || cleaned === '' ? null : cleaned

    console.log('[OCR] Extracted tx_ref:', tx_ref)
    return NextResponse.json({ tx_ref })
  } catch (err: any) {
    console.error('[OCR] Exception:', err.message)
    return NextResponse.json({ tx_ref: null, error: 'OCR failed' }, { status: 500 })
  }
}