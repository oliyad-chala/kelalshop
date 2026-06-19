import { buildBaseEmail } from './base'

export type OrderStatusType = 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export interface OrderStatusData {
  orderNumber: string
  buyerName: string
  itemsSummary: string
  total: number
}

export function buildOrderStatusEmail(status: OrderStatusType, data: OrderStatusData) {
  let icon = '🔄'
  let statusText = 'Processing'
  let headline = 'Your order is being processed'
  let description = 'Great news! We have accepted your order and are currently preparing your items for shipment.'
  let subject = `Your KelalShop order #${data.orderNumber} is now being processed`

  switch (status) {
    case 'shipped':
      icon = '🚚'
      statusText = 'Shipped'
      headline = 'Your order has shipped!'
      description = 'Exciting news! Your package is on its way. Use the link below to track its journey.'
      subject = `Your KelalShop order #${data.orderNumber} has shipped! 🚚`
      break
    case 'delivered':
      icon = '✅'
      statusText = 'Delivered'
      headline = 'Your order has been delivered!'
      description = 'Your package has arrived! We hope you love your new purchase. If you have any questions, feel free to contact us.'
      subject = `Your KelalShop order #${data.orderNumber} has been delivered! ✅`
      break
    case 'cancelled':
      icon = '❌'
      statusText = 'Cancelled'
      headline = 'Your order has been cancelled'
      description = 'We regret to inform you that your order has been cancelled. If this was a mistake, or you need support, please contact us.'
      subject = `Your KelalShop order #${data.orderNumber} has been cancelled`
      break
    case 'refunded':
      icon = '💰'
      statusText = 'Refunded'
      headline = 'Your order has been refunded'
      description = 'We have processed a refund for your order. The funds should appear in your account in 5-10 business days depending on your bank.'
      subject = `Refund issued for your KelalShop order #${data.orderNumber} 💰`
      break
  }

  const title = `Order Status: ${statusText}`

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

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td><span style="font-size: 13px; color: #6b7280; font-weight: 500;">Order Number</span></td>
          <td align="right"><span style="font-size: 13px; color: #6b7280; font-weight: 500;">Order Total</span></td>
        </tr>
        <tr>
          <td><strong class="text-primary" style="font-size: 16px; color: #111827;">#${data.orderNumber}</strong></td>
          <td align="right"><strong class="text-primary" style="font-size: 16px; color: #111827;">$${data.total.toFixed(2)}</strong></td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top: 12px; border-top: 1px solid #e5e7eb; margin-top: 12px;">
            <span style="font-size: 13px; color: #6b7280;">Items: </span>
            <span class="text-primary" style="font-size: 13px; font-weight: 600; color: #111827;">${data.itemsSummary}</span>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://kelalshop.com/orders/${data.orderNumber}" style="background-color: #16a34a; color: #ffffff; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">
        View Order Details
      </a>
    </div>
  `

  const text = `Your KelalShop order #${data.orderNumber} status update: ${headline}. Total: $${data.total.toFixed(2)}. View details: https://kelalshop.com/orders/${data.orderNumber}`

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: headline }),
    text,
  }
}
