import { buildBaseEmail } from './base'

export function buildForgotPasswordEmail(otp: string) {
  const title = 'Reset Your Password'
  const subject = '[KelalShop] Reset your password'

  const htmlContent = `
    <h2 class="text-primary" style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #111827;">
      Password Reset Request
    </h2>
    <p class="text-light" style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.6;">
      We received a request to reset the password for your KelalShop account. Please use the verification code below to reset your password:
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; color: #111827; padding: 16px 32px; border-radius: 8px; font-size: 32px; font-weight: 700; letter-spacing: 4px; display: inline-block;">
        ${otp}
      </div>
    </div>

    <p class="text-muted" style="margin: 24px 0 8px; font-size: 13px; color: #6b7280; line-height: 1.5;">
      <strong>Note:</strong> This code will expire in <strong>10 minutes</strong>.
    </p>
    <p class="text-muted" style="margin: 0 0 24px; font-size: 13px; color: #6b7280; line-height: 1.5;">
      If you did not request a password reset, you can safely ignore this email.
    </p>
  `

  const text = `Reset your KelalShop password by using this code: ${otp}. This code expires in 10 minutes.`

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: 'Reset your KelalShop password' }),
    text,
  }
}
