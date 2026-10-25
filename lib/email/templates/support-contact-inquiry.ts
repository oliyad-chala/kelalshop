import { buildBaseEmail } from './base'

export interface SupportContactInquiryData {
  senderName: string
  senderEmail: string
  subject: string
  message: string
  userId?: string | null
  submittedAt?: string
}

export function buildSupportContactInquiryEmail(data: SupportContactInquiryData) {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelalshop.com'
  const siteUrl = (!rawUrl || rawUrl.includes('localhost')) ? 'https://kelalshop.com' : rawUrl
  const title = `New Support Inquiry: ${data.subject || 'General Inquiry'}`
  const subject = `🔔 [Support Inquiry] ${data.subject || 'New Contact Message'} - from ${data.senderName}`
  const formattedDate = data.submittedAt || new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' })

  const htmlContent = `
    <div style="background: #f8fafc; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 6px; font-size: 18px; font-weight: 700; color: #0f172a;">
        New Contact Form Submission
      </h2>
      <p style="margin: 0; font-size: 14px; color: #64748b;">
        A customer has sent a message through the KelalShop contact page.
      </p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #64748b; width: 120px; font-weight: 600;">From:</td>
        <td style="padding: 8px 0; font-size: 14px; color: #0f172a; font-weight: 700;">${data.senderName} (${data.senderEmail})</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 600;">Subject:</td>
        <td style="padding: 8px 0; font-size: 14px; color: #0f172a;">${data.subject || 'General Inquiry'}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 600;">Date:</td>
        <td style="padding: 8px 0; font-size: 14px; color: #64748b;">${formattedDate}</td>
      </tr>
      ${data.userId ? `<tr>
        <td style="padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 600;">User ID:</td>
        <td style="padding: 8px 0; font-size: 12px; color: #64748b; font-family: monospace;">${data.userId}</td>
      </tr>` : ''}
    </table>

    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
      <h3 style="margin: 0 0 12px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">
        Customer Message
      </h3>
      <p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${siteUrl}/admin/notifications" style="background-color: #f59e0b; color: #ffffff; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
        Open Support Inbox & Reply
      </a>
    </div>

    <p style="margin: 0; font-size: 13px; color: #94a3b8; text-align: center; line-height: 1.5;">
      You can reply directly to this customer inside the KelalShop Admin Support Desk.
    </p>
  `

  const text = `New Support Inquiry from ${data.senderName} (${data.senderEmail}):\n\nSubject: ${data.subject}\n\nMessage:\n${data.message}\n\nReply in Admin Dashboard: ${siteUrl}/admin/notifications`

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: `New inquiry from ${data.senderName}` }),
    text,
  }
}
