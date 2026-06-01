export type LegalSection = {
  title: string
  paragraphs: string[]
  list?: string[]
}

export const LEGAL_LAST_UPDATED = 'May 31, 2026'

export const SUPPORT_TELEGRAM = 'https://t.me/kelalshopp'
export const SUPPORT_TELEGRAM_HANDLE = '@kelalshopp'

export const privacyPolicy: LegalSection[] = [
  {
    title: 'Introduction',
    paragraphs: [
      'KelalShop ("we", "us", "our") operates kelalshop.com, a marketplace that connects buyers in Ethiopia with verified shoppers and importers. This Privacy Policy explains what information we collect, how we use it, and your choices.',
      'By using KelalShop, you agree to the practices described here. If you do not agree, please do not use the platform.',
    ],
  },
  {
    title: 'Information we collect',
    paragraphs: ['We may collect the following types of information:'],
    list: [
      'Account details: name, email address, phone number, profile photo, and role (buyer or shopper).',
      'Shopper verification: government ID images and related documents you submit for verification.',
      'Marketplace activity: product listings, orders, messages, buyer requests, reviews, and campaign participation.',
      'Payment-related records: subscription or boost payment receipts you upload (we do not store card numbers).',
      'Technical data: device information, IP address, browser type, and session cookies used to keep you signed in.',
      'Support chats: messages you send to our AI support widget or to other users on the platform.',
    ],
  },
  {
    title: 'How we use your information',
    paragraphs: ['We use your information to:'],
    list: [
      'Provide and operate the marketplace (listings, orders, chat, notifications).',
      'Verify shopper identities and maintain trust and safety.',
      'Process admin reviews of products, payments, and disputes.',
      'Improve the service, prevent fraud, and enforce our Terms of Service.',
      'Communicate with you about your account, orders, or platform updates.',
    ],
  },
  {
    title: 'How we store and share data',
    paragraphs: [
      'Your data is stored using Supabase (hosted infrastructure with encryption in transit). We do not sell your personal information to third parties.',
      'We may share information with shoppers or buyers when needed to complete a transaction (for example, order details or chat messages). We may disclose information if required by law or to protect the safety of users and the platform.',
    ],
  },
  {
    title: 'Cookies and sessions',
    paragraphs: [
      'We use essential cookies and similar technologies to maintain your login session and secure the site. You can control cookies through your browser settings, but some features may not work if cookies are disabled.',
    ],
  },
  {
    title: 'Your rights',
    paragraphs: [
      'You may request access to, correction of, or deletion of your personal data where applicable under Ethiopian law. To make a request, contact us on Telegram. We may need to verify your identity before processing a request.',
      'You can update much of your profile information directly in your dashboard. You may delete your account by contacting support.',
    ],
  },
  {
    title: 'Data retention',
    paragraphs: [
      'We retain information for as long as your account is active and as needed to comply with legal obligations, resolve disputes, and enforce agreements. Verification documents may be retained for compliance and safety purposes.',
    ],
  },
  {
    title: 'Children',
    paragraphs: [
      'KelalShop is not intended for users under 18. We do not knowingly collect data from children. If you believe a child has provided us data, please contact us so we can remove it.',
    ],
  },
  {
    title: 'Changes to this policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. We will post the revised version on this page with an updated date. Continued use of KelalShop after changes means you accept the updated policy.',
    ],
  },
  {
    title: 'Contact us',
    paragraphs: [
      `For privacy questions or requests, contact us on Telegram: ${SUPPORT_TELEGRAM_HANDLE} (${SUPPORT_TELEGRAM}).`,
    ],
  },
]

export const termsOfService: LegalSection[] = [
  {
    title: 'Agreement',
    paragraphs: [
      'These Terms of Service ("Terms") govern your use of KelalShop at kelalshop.com. By creating an account or using the platform, you agree to these Terms.',
      'If you do not agree, you must not use KelalShop.',
    ],
  },
  {
    title: 'What KelalShop is',
    paragraphs: [
      'KelalShop is a marketplace platform. We connect buyers with independent shoppers (sellers/importers) who list products or fulfill custom import requests.',
      'KelalShop is not the seller of products listed by shoppers unless explicitly stated. Each shopper is responsible for their listings, pricing, delivery commitments, and communication with buyers.',
    ],
  },
  {
    title: 'Accounts',
    paragraphs: ['You must provide accurate information when registering. There are two main account types:'],
    list: [
      'Buyers: browse products, place orders, post buyer requests, and message shoppers.',
      'Shoppers: list products, respond to requests, and manage orders after verification by KelalShop admin.',
    ],
  },
  {
    title: 'Shopper verification',
    paragraphs: [
      'Shoppers must complete identity verification before selling. We may approve or reject verification at our discretion. False or misleading verification documents may result in account suspension.',
    ],
  },
  {
    title: 'Orders and payments',
    paragraphs: [
      'When you place an order, you enter into a transaction with the shopper, facilitated by KelalShop. Payment is handled directly between buyer and shopper using methods they agree on.',
      'KelalShop currently supports manual payment via CBE Birr and Telebirr. Card payments (Visa, Mastercard) are not processed through KelalShop at this time unless we announce otherwise.',
      'You are responsible for completing payment to the shopper as instructed and for confirming delivery. KelalShop does not hold funds in escrow unless a specific feature is explicitly offered and documented.',
    ],
  },
  {
    title: 'Pricing and listings',
    paragraphs: [
      'Shoppers set their own prices. Campaign or promotional prices must be honored when approved. Listings must be accurate, legal to sell in Ethiopia, and not misleading.',
      'We may remove listings or suspend accounts that violate these Terms or our policies.',
    ],
  },
  {
    title: 'Prohibited conduct',
    paragraphs: ['You may not:'],
    list: [
      'Sell illegal, counterfeit, or restricted goods.',
      'Harass, defraud, or impersonate other users.',
      'Circumvent verification, fees, or platform safety measures.',
      'Scrape, attack, or interfere with the platform\'s systems.',
      'Use KelalShop for money laundering or other unlawful activity.',
    ],
  },
  {
    title: 'Disputes',
    paragraphs: [
      'Buyers and shoppers should first try to resolve issues through order chat. KelalShop may assist or review disputes at our discretion but is not obligated to mediate every transaction.',
      'Our admin team may update order status or take action on accounts based on evidence provided. Decisions aimed at platform safety are final within the scope of our policies.',
    ],
  },
  {
    title: 'Intellectual property',
    paragraphs: [
      'KelalShop branding, software, and site content are owned by KelalShop or its licensors. Shoppers grant KelalShop a license to display product images and descriptions they upload. Do not use others\' content without permission.',
    ],
  },
  {
    title: 'Disclaimer of warranties',
    paragraphs: [
      'KelalShop is provided "as is". We do not guarantee uninterrupted service, specific delivery times, or the quality of goods sold by shoppers. Use the platform at your own risk.',
    ],
  },
  {
    title: 'Limitation of liability',
    paragraphs: [
      'To the fullest extent permitted by law, KelalShop and its operators are not liable for indirect, incidental, or consequential damages arising from use of the platform, transactions between users, or payment disputes between buyers and shoppers.',
      'Our total liability for any claim related to the service is limited to the amount you paid to KelalShop for platform fees in the twelve months before the claim, if any.',
    ],
  },
  {
    title: 'Governing law',
    paragraphs: [
      'These Terms are governed by the laws of the Federal Democratic Republic of Ethiopia. Disputes with KelalShop should be brought in competent courts in Ethiopia where applicable.',
    ],
  },
  {
    title: 'Changes',
    paragraphs: [
      'We may update these Terms. The current version will always be posted on this page. Continued use after changes constitutes acceptance.',
    ],
  },
  {
    title: 'Contact',
    paragraphs: [
      `Questions about these Terms? Contact us on Telegram: ${SUPPORT_TELEGRAM_HANDLE} (${SUPPORT_TELEGRAM}).`,
    ],
  },
]
