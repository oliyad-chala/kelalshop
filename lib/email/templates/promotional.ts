import { buildBaseEmail } from './base'

export interface ProductPreview {
  id: string
  name: string
  price: number
  imageUrl?: string
  originalPrice?: number
}

function buildProductGrid(products: ProductPreview[]) {
  const items = products.slice(0, 4) // cap at 4 products
  return `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
      <tr>
        ${items
          .map(
            (p, idx) => `
          <td width="50%" style="padding: 8px; vertical-align: top;">
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center;">
              ${
                p.imageUrl
                  ? `<img src="${p.imageUrl}" alt="${p.name}" style="width: 100%; max-width: 120px; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 8px; background-color: #f3f4f6;" />`
                  : `<div style="width: 100%; height: 120px; background-color: #e5e7eb; border-radius: 6px; margin-bottom: 8px;"></div>`
              }
              <div class="text-primary" style="font-size: 13px; font-weight: 600; color: #111827; height: 36px; overflow: hidden; margin-bottom: 4px; text-overflow: ellipsis;">
                ${p.name}
              </div>
              <div style="font-size: 14px; font-weight: 700; color: #16a34a;">
                $${p.price.toFixed(2)}
                ${p.originalPrice ? `<span style="font-size: 11px; text-decoration: line-through; color: #9ca3af; margin-left: 4px;">$${p.originalPrice.toFixed(2)}</span>` : ''}
              </div>
              <a href="https://kelalshop.com/products/${p.id}" style="display: inline-block; margin-top: 8px; background-color: #16a34a; color: #ffffff; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; text-decoration: none;">
                Buy Now
              </a>
            </div>
          </td>
          ${idx % 2 === 1 ? '</tr><tr>' : ''}
        `
          )
          .join('')}
      </tr>
    </table>
  `
}

export function buildFlashDealEmail(data: { dealName: string; products: ProductPreview[]; endsAt: string }) {
  const title = data.dealName
  const subject = `⚡ FLASH SALE: ${data.dealName} ends soon!`

  const htmlContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px; line-height: 1;">⚡</span>
    </div>
    <h2 class="text-primary" style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #111827; text-align: center;">
      ${data.dealName}
    </h2>
    <p class="text-light" style="margin: 0 0 12px; font-size: 15px; color: #4b5563; line-height: 1.6; text-align: center;">
      Hurry! Huge savings on our best sellers. This deal is active for a limited time and expires on <strong>${data.endsAt}</strong>.
    </p>

    ${buildProductGrid(data.products)}

    <div style="text-align: center; margin: 24px 0 12px;">
      <a href="https://kelalshop.com/deals" style="background-color: #16a34a; color: #ffffff; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">
        Shop the Entire Sale
      </a>
    </div>
  `

  const text = `FLASH SALE: ${data.dealName} ends on ${data.endsAt}! Shop now at https://kelalshop.com/deals.`

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: `Save big in the ${data.dealName}!`, showUnsubscribe: true }),
    text,
  }
}

export function buildNewArrivalsEmail(products: ProductPreview[]) {
  const title = 'New Arrivals'
  const subject = '✨ Fresh Drop: Check out our newest arrivals!'

  const htmlContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px; line-height: 1;">✨</span>
    </div>
    <h2 class="text-primary" style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #111827; text-align: center;">
      Fresh New Arrivals
    </h2>
    <p class="text-light" style="margin: 0 0 12px; font-size: 15px; color: #4b5563; line-height: 1.6; text-align: center;">
      We've just updated our store with brand new styles and gear. Be the first to grab them!
    </p>

    ${buildProductGrid(products)}

    <div style="text-align: center; margin: 24px 0 12px;">
      <a href="https://kelalshop.com/new" style="background-color: #16a34a; color: #ffffff; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">
        Explore New Arrivals
      </a>
    </div>
  `

  const text = 'Check out the new arrivals on KelalShop today! Visit https://kelalshop.com/new.'

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: 'Check out our latest products', showUnsubscribe: true }),
    text,
  }
}

export function buildDiscountOfferEmail(data: { code: string; percentage: number; endsAt: string }) {
  const title = 'Exclusive Offer'
  const subject = `🎁 Special Gift: Get ${data.percentage}% OFF your next order!`

  const htmlContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px; line-height: 1;">🎁</span>
    </div>
    <h2 class="text-primary" style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #111827; text-align: center;">
      A Special Offer Just For You
    </h2>
    <p class="text-light" style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.6; text-align: center;">
      Use the discount code below at checkout to enjoy <strong>${data.percentage}% off</strong> your purchase.
    </p>

    <div style="border: 2px dashed #16a34a; background-color: #f0fdf4; border-radius: 8px; padding: 20px; text-align: center; margin: 24px auto; max-width: 320px;">
      <span style="font-size: 14px; color: #16a34a; font-weight: 600; display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">Use Promo Code</span>
      <span style="font-family: Monaco, Consolas, Courier, monospace; font-size: 28px; font-weight: 700; color: #111827; letter-spacing: 2px;">
        ${data.code}
      </span>
    </div>

    <p class="text-muted" style="margin: 12px 0 24px; font-size: 13px; color: #6b7280; line-height: 1.5; text-align: center;">
      *Offer valid until <strong>${data.endsAt}</strong>. Limit one use per customer.
    </p>

    <div style="text-align: center; margin: 24px 0 12px;">
      <a href="https://kelalshop.com" style="background-color: #16a34a; color: #ffffff; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">
        Claim Your Offer
      </a>
    </div>
  `

  const text = `Get ${data.percentage}% off your next order using coupon code ${data.code}. Offer valid until ${data.endsAt}. Shop now: https://kelalshop.com.`

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: `Get ${data.percentage}% off with coupon ${data.code}`, showUnsubscribe: true }),
    text,
  }
}

export function buildHolidayPromotionEmail(data: { name: string; headline: string; products: ProductPreview[] }) {
  const title = data.name
  const subject = `🎉 ${data.headline}`

  const htmlContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 48px; line-height: 1;">🎉</span>
    </div>
    <h2 class="text-primary" style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #111827; text-align: center;">
      ${data.name}
    </h2>
    <p class="text-light" style="margin: 0 0 12px; font-size: 15px; color: #4b5563; line-height: 1.6; text-align: center;">
      ${data.headline}
    </p>

    ${buildProductGrid(data.products)}

    <div style="text-align: center; margin: 24px 0 12px;">
      <a href="https://kelalshop.com/seasonal" style="background-color: #16a34a; color: #ffffff; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block;">
        Celebrate and Shop
      </a>
    </div>
  `

  const text = `${data.name} - ${data.headline}. Shop our seasonal collection: https://kelalshop.com/seasonal.`

  return {
    subject,
    html: buildBaseEmail(htmlContent, { title, preheader: data.headline, showUnsubscribe: true }),
    text,
  }
}
