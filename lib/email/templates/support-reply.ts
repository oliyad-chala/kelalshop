import { buildBaseEmail } from './base'

export interface SupportReplyData {
  customerName: string
  adminName?: string
  replyMessage: string
  ticketOrConversationUrl?: string
}

export function buildSupportReplyEmail(data: SupportReplyData) {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelalshop.com'
  const siteUrl = (!rawUrl || rawUrl.includes('localhost')) ? 'https://kelalshop.com' : rawUrl
  const title = 'New Reply from KelalShop Support'
  const subject = '💬 New reply from KelalShop Support'
  const conversationUrl = data.ticketOrConversationUrl || `${siteUrl}/dashboard/chat`
  const adminName = data.adminName || 'KelalShop Support Team'

  const htmlContent = `
    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #0f172a;">
      Hello ${data.customerName || 'there'},
    </h2>
    <p style="margin: 0 0 20px; font-size: 15px; color: #475569; line-height: 1.6;">
      Our support team has reviewed your inquiry and replied to your message:
    </p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 13px; font-weight: 700; color: #3b82f6; margin-bottom: 8px;">
        ${adminName}
      </div>
      <p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${data.replyMessage}</p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${conversationUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
        View & Reply on KelalShop
      </a>
    </div>

    <p style="margin: 0; font-size: 13px; color: #94a3b8; text-align: center; line-height: 1.5;">
      You can continue this conversation anytime directly from your KelalShop Dashboard.
    </p>
  `

  const text = `Hello ${data.customerName},\n\nOur support team replied:\n\n"${data.replyMessage}"\n\nView and reply in your account dashboard: ${conversationUrl}`

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: 'KelalShop Support replied to your message' }),
    text,
  }
}
