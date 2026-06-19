import { buildBaseEmail } from './base'

export interface OrderItem {
  name: string
  price: number
  imageUrl?: string
}

export interface OrderConfirmationData {
  orderNumber: string
  buyerName: string
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  total: number
  estimatedDelivery: string
}

export function buildOrderConfirmationEmail(data: OrderConfirmationData) {
  const title = `Order Confirmation #${data.orderNumber}`
  const subject = `Thank you for your order! #${data.orderNumber}`

  const itemsListHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
        <table border="0" cellspacing="0" cellpadding="0" width="100%">
          <tr>
            ${
              item.imageUrl
                ? `<td width="50" style="padding-right: 12px; vertical-align: middle;">
                    <img src="${item.imageUrl}" alt="${item.name}" width="40" height="40" style="border-radius: 4px; object-fit: cover; background-color: #f3f4f6;" />
                   </td>`
                : ''
            }
            <td style="vertical-align: middle;">
              <span class="text-primary" style="font-size: 14px; font-weight: 600; color: #111827;">${item.name}</span>
            </td>
            <td align="right" style="vertical-align: middle;">
              <span class="text-primary" style="font-size: 14px; font-weight: 600; color: #111827;">$${item.price.toFixed(2)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
    )
    .join('')

  const htmlContent = `
    <h2 class="text-primary" style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #111827;">
      Thanks for your order, ${data.buyerName}!
    </h2>
    <p class="text-light" style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.6;">
      We've received your order and are getting it ready. You will find details about your purchase below.
    </p>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td><span style="font-size: 13px; color: #6b7280; font-weight: 500;">Order Number</span></td>
          <td align="right"><span style="font-size: 13px; color: #6b7280; font-weight: 500;">Estimated Delivery</span></td>
        </tr>
        <tr>
          <td><strong class="text-primary" style="font-size: 16px; color: #111827;">#${data.orderNumber}</strong></td>
          <td align="right"><strong class="text-primary" style="font-size: 16px; color: #111827;">${data.estimatedDelivery}</strong></td>
        </tr>
      </table>
    </div>

    <h3 class="text-primary" style="margin: 24px 0 12px; font-size: 15px; font-weight: 600; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
      Order Summary
    </h3>
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      ${itemsListHtml}
    </table>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; font-size: 14px;">
      <tr>
        <td style="padding: 6px 0; color: #6b7280;">Subtotal</td>
        <td align="right" class="text-primary" style="padding: 6px 0; color: #111827;">$${data.subtotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #6b7280;">Shipping</td>
        <td align="right" class="text-primary" style="padding: 6px 0; color: #111827;">$${data.shippingFee.toFixed(2)}</td>
      </tr>
      <tr style="font-size: 16px; font-weight: 700;">
        <td style="padding: 12px 0; border-top: 1px solid #e5e7eb; color: #111827;" class="text-primary">Total</td>
        <td align="right" class="text-primary" style="padding: 12px 0; border-top: 1px solid #e5e7eb; color: #16a34a;">$${data.total.toFixed(2)}</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://kelalshop.com/orders/${data.orderNumber}" style="background-color: #16a34a; color: #ffffff; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">
        View Your Order
      </a>
    </div>
  `

  const text = `Thank you for your order, ${data.buyerName}! Order #${data.orderNumber}. Total: $${data.total.toFixed(2)}. Track it here: https://kelalshop.com/orders/${data.orderNumber}`

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: `Thank you for your order #${data.orderNumber}` }),
    text,
  }
}
