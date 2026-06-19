import { buildBaseEmail } from './base'

export function buildOtpEmail(
  otp: string,
  purpose: 'device-verification' | 'telegram-link' | 'email-verification',
  expiresInMinutes = 10
) {
  const purposeText = purpose === 'device-verification'
    ? 'verify your new device'
    : purpose === 'email-verification'
    ? 'verify your email address'
    : 'link your Telegram account'

  const title = 'Your KelalShop Verification Code'
  const subject = `[KelalShop] ${otp} is your verification code`

  const htmlContent = `
    <h2 class="text-primary" style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #111827;">
      Verify Your Identity
    </h2>
    <p class="text-light" style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.6;">
      Please use the following verification code to <strong>${purposeText}</strong>. 
      This code is temporary and will expire in <strong>${expiresInMinutes} minutes</strong>.
    </p>
    
    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
      <span style="font-family: Monaco, Consolas, Courier, monospace; font-size: 36px; font-weight: 700; color: #111827; letter-spacing: 8px;">
        ${otp}
      </span>
    </div>

    <p class="text-light" style="margin: 24px 0 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
      If you did not request this verification code, please ignore this email or contact support if you believe your account is compromised.
    </p>
  `

  const text = `Your KelalShop verification code is: ${otp}. It expires in ${expiresInMinutes} minutes.`

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: `Your verification code is ${otp}` }),
    text,
  }
}
