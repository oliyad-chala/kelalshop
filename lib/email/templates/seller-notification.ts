import { buildBaseEmail } from './base'

export function buildSellerNewOrderEmail(data: {
  orderNumber: string
  buyerName: string
  items: Array<{ name: string; price: number }>
  total: number
}) {
  const title = 'New Order Received!'
  const subject = `🎉 New Order #${data.orderNumber} received!`

  const itemsHtml = data.items
    .map(
      (item) => `
    <li style="margin-bottom: 6px;">
      <span style="font-weight: 600; color: #111827;">${item.name}</span> - $${item.price.toFixed(2)}
    </li>`
    )
    .join('')

  const htmlContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px; line-height: 1;">🎉</span>
    </div>
    <h2 class="text-primary" style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #111827; text-align: center;">
      You've Made a Sale!
    </h2>
    <p class="text-light" style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.6; text-align: center;">
      Great job! A new order has been placed by <strong>${data.buyerName}</strong>. Please review and process it.
    </p>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <h4 style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #111827;">Order Details</h4>
      <p style="margin: 0 0 8px; font-size: 13px; color: #4b5563;">Order Number: <strong>#${data.orderNumber}</strong></p>
      <p style="margin: 0 0 12px; font-size: 13px; color: #4b5563;">Payout Amount: <strong>$${data.total.toFixed(2)}</strong></p>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
        <span style="font-size: 13px; font-weight: 600; color: #111827; display: block; margin-bottom: 6px;">Items to ship:</span>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #4b5563;">
          ${itemsHtml}
        </ul>
      </div>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://kelalshop.com/dashboard/orders/${data.orderNumber}" style="background-color: #16a34a; color: #ffffff; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">
        Process Order
      </a>
    </div>
  `

  const text = `Congratulations! You received new order #${data.orderNumber} from ${data.buyerName}. Total payout: $${data.total.toFixed(2)}. Process it at https://kelalshop.com/dashboard/orders/${data.orderNumber}`

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: `New sale for order #${data.orderNumber}!` }),
    text,
  }
}

export function buildSellerVerificationEmail(status: 'approved' | 'rejected', reason?: string) {
  const isApproved = status === 'approved'
  const icon = isApproved ? '✅' : '❌'
  const title = isApproved ? 'Seller Account Approved' : 'Seller Account Verification Status'
  const subject = isApproved
    ? 'Congratulations! Your KelalShop seller account is approved 🎉'
    : 'KelalShop Seller Account Verification Update'

  const headline = isApproved
    ? 'Welcome to KelalShop Marketplace!'
    : 'Seller Account Verification Status'

  const description = isApproved
    ? 'We have reviewed your application and verified your seller account. You can now start listing products and making sales.'
    : `Unfortunately, we were unable to verify your seller account at this time.`

  const reasonHtml = !isApproved && reason
    ? `<div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 16px; margin: 24px 0; color: #991b1b; font-size: 14px;">
        <strong>Reason for rejection:</strong><br/>
        ${reason}
       </div>`
    : ''

  const ctaButton = isApproved
    ? `<div style="text-align: center; margin: 32px 0;">
        <a href="https://kelalshop.com/dashboard" style="background-color: #16a34a; color: #ffffff; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">
          Go to Seller Dashboard
        </a>
       </div>`
    : `<div style="text-align: center; margin: 32px 0;">
        <a href="https://kelalshop.com/dashboard/verify" style="background-color: #dc2626; color: #ffffff; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">
          Re-submit Verification
        </a>
       </div>`

  const htmlContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px; line-height: 1;">${icon}</span>
    </div>
    <h2 class="text-primary" style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #111827; text-align: center;">
      ${headline}
    </h2>
    <p class="text-light" style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.6; text-align: center;">
      ${description}
    </p>

    ${reasonHtml}
    ${ctaButton}
  `

  const text = isApproved
    ? `Your KelalShop seller account has been approved! Start listing items: https://kelalshop.com/dashboard`
    : `Your KelalShop seller verification was rejected. Reason: ${reason || 'N/A'}. Details: https://kelalshop.com/dashboard/verify`

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: headline }),
    text,
  }
}

export function buildSellerPayoutEmail(data: { amount: number; reference: string }) {
  const title = 'Payout Processed'
  const subject = `💰 Payout of $${data.amount.toFixed(2)} processed`

  const htmlContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px; line-height: 1;">💰</span>
    </div>
    <h2 class="text-primary" style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #111827; text-align: center;">
      Payout Initiated!
    </h2>
    <p class="text-light" style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.6; text-align: center;">
      We have processed your payout. The funds are on their way to your registered bank account or wallet.
    </p>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td><span style="font-size: 13px; color: #6b7280; font-weight: 500;">Payout Amount</span></td>
          <td align="right"><span style="font-size: 13px; color: #6b7280; font-weight: 500;">Reference Code</span></td>
        </tr>
        <tr>
          <td><strong style="font-size: 18px; color: #16a34a;">$${data.amount.toFixed(2)}</strong></td>
          <td align="right"><strong class="text-primary" style="font-size: 14px; color: #111827;">${data.reference}</strong></td>
        </tr>
      </table>
    </div>

    <p class="text-muted" style="margin: 24px 0 0; font-size: 13px; color: #6b7280; line-height: 1.5; text-align: center;">
      Payouts typically take 1-3 business days to clear depending on your financial institution.
    </p>
  `

  const text = `Your KelalShop payout of $${data.amount.toFixed(2)} was processed. Reference code: ${data.reference}.`

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: `Payout of $${data.amount.toFixed(2)} processed` }),
    text,
  }
}
