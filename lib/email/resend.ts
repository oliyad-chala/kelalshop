import { Resend } from 'resend'

// ---------------------------------------------------------------------------
// Resend client (singleton)
// ---------------------------------------------------------------------------

if (!process.env.RESEND_API_KEY) {
  console.warn('[Resend] RESEND_API_KEY is not set – emails will not be sent.')
}

export const resendClient = new Resend(process.env.RESEND_API_KEY ?? '')

// ---------------------------------------------------------------------------
// "From" address
// ---------------------------------------------------------------------------

const FROM = process.env.EMAIL_FROM ?? 'KelalShop <noreply@kelalshop.com>'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Send a Telegram-link or general OTP to the user's email */
export async function sendOtpEmail(to: string, otp: string, purposeText = 'link your Telegram account') {
  const subject = 'Your KelalShop One-Time Code'
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
      <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px">
        Your one-time code
      </h1>
      <p style="color:#6b7280;font-size:15px;margin:0 0 24px">
        Use the code below to ${purposeText} on KelalShop.
        It expires in <strong>10 minutes</strong>.
      </p>
      <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;letter-spacing:8px;font-size:36px;font-weight:700;color:#111827">
        ${otp}
      </div>
      <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>
  `
  const text = `Your KelalShop verification code is: ${otp}. It expires in 10 minutes.`

  const { data, error } = await resendClient.emails.send({
    from: FROM,
    to,
    subject,
    html,
    text,
  })

  if (error) {
    console.error('[Resend] Failed to send OTP email:', error)
    throw new Error('Failed to send OTP email.')
  }

  console.log('[Resend] Email sent successfully:', { id: data?.id, to, subject })
  return data
}

/** Generic transactional email helper (use for order confirmations, etc.) */
export async function sendTransactionalEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
}) {
  const { data, error } = await resendClient.emails.send({
    from: FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text: text ?? subject,
  })

  if (error) {
    console.error('[Resend] Failed to send email:', error)
    throw new Error('Failed to send email.')
  }

  console.log('[Resend] Email sent successfully:', { id: data?.id, to, subject })
  return data
}

