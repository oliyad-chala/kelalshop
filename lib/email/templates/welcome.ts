import { buildBaseEmail } from './base'

export function buildWelcomeEmail(firstName: string) {
  const title = 'Welcome to KelalShop!'
  const subject = `Welcome to KelalShop, ${firstName}! ✨`

  const htmlContent = `
    <h2 class="text-primary" style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #111827;">
      Welcome aboard, ${firstName}!
    </h2>
    <p class="text-light" style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.6;">
      We are absolutely thrilled to have you join the KelalShop community. We are dedicated to providing you with the best online shopping experience.
    </p>

    <h3 class="text-primary" style="margin: 24px 0 12px; font-size: 16px; font-weight: 600; color: #111827;">
      Here is what you can look forward to:
    </h3>
    <ul style="margin: 0 0 24px; padding-left: 20px; color: #4b5563; line-height: 1.6;">
      <li style="margin-bottom: 8px;"><strong>Curated Quality:</strong> Hand-picked local and international products you'll love.</li>
      <li style="margin-bottom: 8px;"><strong>Secure & Fast Checkout:</strong> Safe payments and a smooth order process.</li>
      <li style="margin-bottom: 8px;"><strong>Reliable Delivery:</strong> Tracked shipping straight to your doorstep.</li>
    </ul>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://kelalshop.com" style="background-color: #16a34a; color: #ffffff; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">
        Shop Now
      </a>
    </div>

    <p class="text-light" style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
      If you have any questions or need help, our support team is always here for you. Just reply to this email or visit our support portal.
    </p>
  `

  const text = `Welcome to KelalShop, ${firstName}! We are thrilled to have you. Shop now at https://kelalshop.com.`

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: 'Welcome to KelalShop!' }),
    text,
  }
}
