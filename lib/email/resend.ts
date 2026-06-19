import { Resend } from 'resend'

// ---------------------------------------------------------------------------
// Resend client (singleton)
// ---------------------------------------------------------------------------

if (!process.env.RESEND_API_KEY) {
  console.warn('[Resend] RESEND_API_KEY is not set – emails will not be sent.')
}

const resend = new Resend(process.env.RESEND_API_KEY ?? '')

// ---------------------------------------------------------------------------
// "From" address
// Resend requires a verified domain. Until you add kelalshop.com to Resend,
// use the built-in sandbox address "onboarding@resend.dev" (only delivers to
// the address registered on your Resend account).
// ---------------------------------------------------------------------------

const FROM = process.env.EMAIL_FROM ?? 'KelalShop <onboarding@resend.dev>'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Send a Telegram-link OTP to the user's email */
export async function sendOtpEmail(to: string, otp: string) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your KelalShop Telegram Link Code',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
        <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px">
          Your one-time code
        </h1>
        <p style="color:#6b7280;font-size:15px;margin:0 0 24px">
          Use the code below to link your Telegram account on KelalShop.
          It expires in <strong>10 minutes</strong>.
        </p>
        <div style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;letter-spacing:8px;font-size:36px;font-weight:700;color:#111827">
          ${otp}
        </div>
        <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('[Resend] Failed to send OTP email:', error)
    throw new Error('Failed to send OTP email.')
  }

  return data
}

/** Generic transactional email helper (use for order confirmations, etc.) */
export async function sendTransactionalEmail({
  to,
  subject,
  html,
}: {
  to: string | string[]
  subject: string
  html: string
}) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  })

  if (error) {
    console.error('[Resend] Failed to send email:', error)
    throw new Error('Failed to send email.')
  }

  return data
}
