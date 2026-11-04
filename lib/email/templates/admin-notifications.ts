import { buildBaseEmail } from './base'

export interface AdminProductPendingEmailData {
  productId: string
  productName: string
  price: number
  stock: number
  categoryName?: string | null
  location?: string | null
  sellerName: string
  sellerEmail?: string | null
}

export function buildAdminProductPendingEmail(data: AdminProductPendingEmailData) {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelalshop.com'
  const siteUrl = (!rawUrl || rawUrl.includes('localhost')) ? 'https://kelalshop.com' : rawUrl
  const adminProductsUrl = `${siteUrl}/admin/products`

  const subject = `📦 [Action Required] New Product Pending Approval: ${data.productName}`

  const htmlContent = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; padding: 6px 14px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #b45309; background-color: #fef3c7; border-radius: 9999px;">
        Listing Approval Needed
      </span>
    </div>

    <h2 class="text-primary" style="margin: 0 0 10px; font-size: 22px; font-weight: 700; color: #111827; text-align: center;">
      New Product Awaiting Review
    </h2>

    <p class="text-light" style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.6; text-align: center;">
      A seller has just posted a new listing that requires admin approval before it becomes visible to buyers.
    </p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 14px; font-size: 15px; font-weight: 700; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
        Product Information
      </h3>

      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px; line-height: 1.8;">
        <tr>
          <td style="color: #6b7280; width: 140px; padding-bottom: 6px;">Product Name:</td>
          <td style="font-weight: 600; color: #111827; padding-bottom: 6px;">${data.productName}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; padding-bottom: 6px;">Price:</td>
          <td style="font-weight: 700; color: #059669; padding-bottom: 6px;">${data.price.toLocaleString()} ETB</td>
        </tr>
        <tr>
          <td style="color: #6b7280; padding-bottom: 6px;">Stock Available:</td>
          <td style="font-weight: 600; color: #111827; padding-bottom: 6px;">${data.stock}</td>
        </tr>
        ${data.categoryName ? `
        <tr>
          <td style="color: #6b7280; padding-bottom: 6px;">Category:</td>
          <td style="color: #111827; padding-bottom: 6px;">${data.categoryName}</td>
        </tr>` : ''}
        ${data.location ? `
        <tr>
          <td style="color: #6b7280; padding-bottom: 6px;">Location:</td>
          <td style="color: #111827; padding-bottom: 6px;">${data.location}</td>
        </tr>` : ''}
        <tr>
          <td style="color: #6b7280; padding-bottom: 6px;">Seller / Store:</td>
          <td style="font-weight: 600; color: #111827; padding-bottom: 6px;">${data.sellerName}${data.sellerEmail ? ` (${data.sellerEmail})` : ''}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0 16px;">
      <a href="${adminProductsUrl}" style="background-color: #d97706; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2);">
        Review & Approve Product &rarr;
      </a>
    </div>

    <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5;">
      You can also open your <a href="${adminProductsUrl}" style="color: #d97706; text-decoration: underline;">Admin Products Panel</a> directly to approve or reject.
    </p>
  `

  const textContent = `
[Action Required] New Product Awaiting Review

A seller has posted a new product listing awaiting admin approval.

Product: ${data.productName}
Price: ${data.price.toLocaleString()} ETB
Stock: ${data.stock}
Location: ${data.location ?? 'N/A'}
Seller: ${data.sellerName} ${data.sellerEmail ? `(${data.sellerEmail})` : ''}

Review and approve the product here:
${adminProductsUrl}
  `.trim()

  return {
    subject,
    html: buildBaseEmail(htmlContent, {
      title: 'New Product Pending Approval',
      preheader: `New listing "${data.productName}" submitted by ${data.sellerName} needs approval`,
      showUnsubscribe: false,
    }),
    text: textContent,
  }
}

export interface AdminVerificationPendingEmailData {
  shopperId: string
  sellerName?: string | null
  businessName?: string | null
  phone: string
  email?: string | null
}

export function buildAdminVerificationPendingEmail(data: AdminVerificationPendingEmailData) {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelalshop.com'
  const siteUrl = (!rawUrl || rawUrl.includes('localhost')) ? 'https://kelalshop.com' : rawUrl
  const adminVerificationsUrl = `${siteUrl}/admin/verifications?tab=pending`

  const displayName = data.businessName || data.sellerName || 'New Seller'
  const subject = `🛡️ [Action Required] New Seller ID Verification Submitted: ${displayName}`

  const htmlContent = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; padding: 6px 14px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #1e40af; background-color: #dbeafe; border-radius: 9999px;">
        Identity Verification
      </span>
    </div>

    <h2 class="text-primary" style="margin: 0 0 10px; font-size: 22px; font-weight: 700; color: #111827; text-align: center;">
      New Seller ID Document Submitted
    </h2>

    <p class="text-light" style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.6; text-align: center;">
      A seller has uploaded their official identification document and agreed to the seller contract. Please review their submission to verify their seller profile.
    </p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 14px; font-size: 15px; font-weight: 700; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
        Seller Details
      </h3>

      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px; line-height: 1.8;">
        ${data.businessName ? `
        <tr>
          <td style="color: #6b7280; width: 140px; padding-bottom: 6px;">Business Name:</td>
          <td style="font-weight: 700; color: #111827; padding-bottom: 6px;">${data.businessName}</td>
        </tr>` : ''}
        ${data.sellerName ? `
        <tr>
          <td style="color: #6b7280; width: 140px; padding-bottom: 6px;">Full Name:</td>
          <td style="font-weight: 600; color: #111827; padding-bottom: 6px;">${data.sellerName}</td>
        </tr>` : ''}
        <tr>
          <td style="color: #6b7280; padding-bottom: 6px;">Phone Number:</td>
          <td style="font-weight: 600; color: #111827; padding-bottom: 6px;">${data.phone}</td>
        </tr>
        ${data.email ? `
        <tr>
          <td style="color: #6b7280; padding-bottom: 6px;">Account Email:</td>
          <td style="color: #111827; padding-bottom: 6px;">${data.email}</td>
        </tr>` : ''}
        <tr>
          <td style="color: #6b7280; padding-bottom: 6px;">Status:</td>
          <td style="font-weight: 700; color: #d97706; padding-bottom: 6px;">Pending Admin Verification</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0 16px;">
      <a href="${adminVerificationsUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
        Review ID Document &rarr;
      </a>
    </div>

    <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5;">
      You can open your <a href="${adminVerificationsUrl}" style="color: #2563eb; text-decoration: underline;">Admin Verifications Queue</a> to view the uploaded document, approve, or reject.
    </p>
  `

  const textContent = `
[Action Required] New Seller ID Verification Submitted

Seller ${displayName} has uploaded an identity document for verification.

Business Name: ${data.businessName ?? 'N/A'}
Full Name: ${data.sellerName ?? 'N/A'}
Phone: ${data.phone}
Email: ${data.email ?? 'N/A'}
Status: Pending Verification

Review the ID document in the admin dashboard:
${adminVerificationsUrl}
  `.trim()

  return {
    subject,
    html: buildBaseEmail(htmlContent, {
      title: 'New Seller Verification Submitted',
      preheader: `Seller ${displayName} submitted an ID document for verification`,
      showUnsubscribe: false,
    }),
    text: textContent,
  }
}
