import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/site'
import { FAQJsonLd } from '@/components/seo/FAQJsonLd'

export const metadata: Metadata = {
  title: 'FAQ — Frequently Asked Questions | KelalShop',
  description:
    'Find answers to the most common questions about KelalShop — Ethiopia\'s best online shopping marketplace. Learn about ordering, payments in ETB, delivery, and verified shoppers.',
  alternates: {
    canonical: `${SITE_URL}/faq`,
  },
}

const FAQ_QUESTIONS = [
  {
    q: 'What is KelalShop?',
    a: "KelalShop is Ethiopia's leading online shopping marketplace that connects Ethiopian buyers with verified local shoppers and international importers. You can order products from AliExpress, Shein, Amazon, and more — and pay in ETB (Ethiopian Birr)."
  },
  {
    q: 'Is KelalShop available across all of Ethiopia?',
    a: 'Yes! KelalShop connects you with verified shoppers and importers across Ethiopia including Addis Ababa, Dire Dawa, Hawassa, Bahir Dar, Mekelle, Adama, and beyond.'
  },
  {
    q: 'Is KelalShop free to use?',
    a: 'Yes, creating a KelalShop account is completely free. You can browse products, post buying requests, and connect with verified shoppers at no cost.'
  },
  {
    q: 'What makes KelalShop different from other Ethiopian e-commerce platforms?',
    a: "KelalShop is unique because we allow you to buy from international stores like AliExpress, Shein, and Amazon using Ethiopian Birr (ETB), through our network of verified local shoppers. Every shopper is identity-verified and rated by real buyers."
  },
  {
    q: 'How do I place an order on KelalShop?',
    a: 'Simply browse products, click "Buy Now" or "Add to Cart", select your preferred verified shopper, and confirm your order. You then coordinate with the shopper for payment and delivery details.'
  },
  {
    q: 'Can I request a product that is not listed?',
    a: 'Yes! Use our "Post a Request" feature at kelalshop.com/requests/new. Describe what you want to buy, set your budget, and verified shoppers in our network will respond with offers.'
  },
  {
    q: 'What international stores can I shop from through KelalShop?',
    a: 'Through our verified shoppers, you can order from AliExpress, Shein, Amazon, ASOS, Zara, Alibaba, eBay, Temu, and many more international stores — all delivered to Ethiopia.'
  },
  {
    q: 'How do I know if a product is authentic?',
    a: 'Our verified shoppers provide real product photos, receipts, and shipping tracking. Every shopper has a public trust score and buyer reviews visible on their profile page.'
  },
  {
    q: 'What payment methods are accepted on KelalShop?',
    a: 'KelalShop accepts CBE Birr and Telebirr for local ETB payments. Payments are made directly to your verified shopper after placing your order. We do not process payments directly — we facilitate the connection.'
  },
  {
    q: 'Do I pay in Ethiopian Birr (ETB)?',
    a: 'Yes! All prices on KelalShop are displayed and paid in Ethiopian Birr (ETB). Your shopper handles the international currency conversion for you.'
  },
  {
    q: 'How long does delivery take?',
    a: 'Delivery times vary by product and origin country. Standard international shipping from China takes 15–30 days. Express shipping options (7–14 days) may be available at extra cost. Your shopper will give you an estimated delivery date at the time of order.'
  }
]

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FAQJsonLd questions={FAQ_QUESTIONS} />
      {children}
    </>
  )
}

