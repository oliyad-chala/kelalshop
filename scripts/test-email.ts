import { config } from 'dotenv'
config({ path: '.env.local' })

import { queueEmail } from '../lib/email/queue'
import * as templates from '../lib/email/templates'

const testEmail = process.argv[2] || 'test@example.com'

async function run() {
  console.log(`🚀 Starting email verification test to: ${testEmail}\n`)

  const testProducts = [
    { id: 'prod-1', name: 'Premium Leather Jacket', price: 120.00, imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500', originalPrice: 150.00 },
    { id: 'prod-2', name: 'Minimalist Wristwatch', price: 85.00, imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500' }
  ]

  const emailsToTest = [
    {
      name: 'OTP (Device Verification)',
      type: 'otp-device',
      data: templates.buildOtpEmail('482910', 'device-verification', 10),
    },
    {
      name: 'OTP (Telegram Link)',
      type: 'otp-telegram',
      data: templates.buildOtpEmail('918273', 'telegram-link', 10),
    },
    {
      name: 'Forgot Password',
      type: 'forgot-password',
      data: templates.buildForgotPasswordEmail('https://kelalshop.com/auth/update-password?token=test-token'),
    },
    {
      name: 'Welcome',
      type: 'welcome',
      data: templates.buildWelcomeEmail('Abebe'),
    },
    {
      name: 'Order Confirmation',
      type: 'order-confirmation',
      data: templates.buildOrderConfirmationEmail({
        orderNumber: 'KS-89210',
        buyerName: 'Abebe Kebede',
        items: [
          { name: 'Premium Leather Jacket', price: 120.00, imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500' }
        ],
        subtotal: 120.00,
        shippingFee: 15.00,
        total: 135.00,
        estimatedDelivery: 'June 25, 2026',
      }),
    },
    {
      name: 'Order Status (Processing)',
      type: 'order-status-processing',
      data: templates.buildOrderStatusEmail('processing', {
        orderNumber: 'KS-89210',
        buyerName: 'Abebe Kebede',
        itemsSummary: 'Premium Leather Jacket',
        total: 135.00,
      }),
    },
    {
      name: 'Order Status (Shipped)',
      type: 'order-status-shipped',
      data: templates.buildOrderStatusEmail('shipped', {
        orderNumber: 'KS-89210',
        buyerName: 'Abebe Kebede',
        itemsSummary: 'Premium Leather Jacket',
        total: 135.00,
      }),
    },
    {
      name: 'Order Status (Delivered)',
      type: 'order-status-delivered',
      data: templates.buildOrderStatusEmail('delivered', {
        orderNumber: 'KS-89210',
        buyerName: 'Abebe Kebede',
        itemsSummary: 'Premium Leather Jacket',
        total: 135.00,
      }),
    },
    {
      name: 'Order Status (Cancelled)',
      type: 'order-status-cancelled',
      data: templates.buildOrderStatusEmail('cancelled', {
        orderNumber: 'KS-89210',
        buyerName: 'Abebe Kebede',
        itemsSummary: 'Premium Leather Jacket',
        total: 135.00,
      }),
    },
    {
      name: 'Order Status (Refunded)',
      type: 'order-status-refunded',
      data: templates.buildOrderStatusEmail('refunded', {
        orderNumber: 'KS-89210',
        buyerName: 'Abebe Kebede',
        itemsSummary: 'Premium Leather Jacket',
        total: 135.00,
      }),
    },
    {
      name: 'Seller New Order',
      type: 'seller-new-order',
      data: templates.buildSellerNewOrderEmail({
        orderNumber: 'KS-89210',
        buyerName: 'Abebe Kebede',
        items: [{ name: 'Premium Leather Jacket', price: 120.00 }],
        total: 114.00, // payout total after commission
      }),
    },
    {
      name: 'Seller Verification Approved',
      type: 'seller-verification-approved',
      data: templates.buildSellerVerificationEmail('approved'),
    },
    {
      name: 'Seller Verification Rejected',
      type: 'seller-verification-rejected',
      data: templates.buildSellerVerificationEmail('rejected', 'Provided identification document was expired.'),
    },
    {
      name: 'Seller Payout',
      type: 'seller-payout',
      data: templates.buildSellerPayoutEmail({ amount: 350.00, reference: 'PAY-89210-XYZ' }),
    },
    {
      name: 'Security (Password Changed)',
      type: 'security-password-changed',
      data: templates.buildPasswordChangedEmail('Abebe Kebede'),
    },
    {
      name: 'Security (Email Changed)',
      type: 'security-email-changed',
      data: templates.buildEmailChangedEmail('Abebe Kebede', 'abebe.new@example.com'),
    },
    {
      name: 'Security (New Device Login)',
      type: 'security-new-device',
      data: templates.buildNewDeviceLoginEmail({
        fullName: 'Abebe Kebede',
        ipAddress: '197.156.12.89',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
        location: 'Addis Ababa, Ethiopia',
        timestamp: new Date().toLocaleString(),
      }),
    },
    {
      name: 'Security (Suspicious Login)',
      type: 'security-suspicious',
      data: templates.buildSuspiciousLoginEmail({
        fullName: 'Abebe Kebede',
        ipAddress: '82.102.23.4',
        userAgent: 'Opera/9.80 (Android; Opera Mini; U; en)',
        location: 'Unknown Location',
        timestamp: new Date().toLocaleString(),
      }),
    },
    {
      name: 'Promotional (Flash Deal)',
      type: 'promo-flash',
      data: templates.buildFlashDealEmail({
        dealName: 'Weekend Super Flash Sale',
        products: testProducts,
        endsAt: 'June 21, 2026 at midnight',
      }),
    },
    {
      name: 'Promotional (New Arrivals)',
      type: 'promo-new',
      data: templates.buildNewArrivalsEmail(testProducts),
    },
    {
      name: 'Promotional (Discount Offer)',
      type: 'promo-discount',
      data: templates.buildDiscountOfferEmail({ code: 'KELAL20', percentage: 20, endsAt: 'June 30, 2026' }),
    },
    {
      name: 'Promotional (Holiday)',
      type: 'promo-holiday',
      data: templates.buildHolidayPromotionEmail({
        name: 'Eid Al-Adha Celebration',
        headline: 'Special Holiday Discounts on Premium Clothing & Gifts',
        products: testProducts,
      }),
    }
  ]

  for (const email of emailsToTest) {
    const idKey = `test-${email.type}-${Date.now()}`
    try {
      console.log(`⏳ Sending ${email.name}...`)
      const res = await queueEmail(email.type, {
        to: testEmail,
        subject: email.data.subject,
        html: email.data.html,
        text: email.data.text,
      }, idKey)

      if (res.sent) {
        console.log(`✅ Sent! Resend ID: ${res.resendId}`)
      } else {
        console.error(`❌ Failed: ${res.error}`)
      }
    } catch (err: any) {
      console.error(`💥 Error sending ${email.name}:`, err?.message || err)
    }
    console.log('---')
  }

  console.log('🎉 Verification test completed!')
}

run().catch(console.error)
