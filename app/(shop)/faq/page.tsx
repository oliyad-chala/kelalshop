'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ShoppingBag, Truck, CreditCard, Shield, Users, HelpCircle } from 'lucide-react'

const FAQ_CATEGORIES = [
  {
    id: 'general',
    label: 'General',
    icon: HelpCircle,
    color: 'bg-amber-50 text-amber-600',
    questions: [
      {
        q: 'What is KelalShop?',
        a: 'KelalShop is Ethiopia\'s leading online shopping marketplace that connects Ethiopian buyers with verified local shoppers and international importers. You can order products from AliExpress, Shein, Amazon, and more — and pay in ETB (Ethiopian Birr).',
      },
      {
        q: 'Is KelalShop available across all of Ethiopia?',
        a: 'Yes! KelalShop connects you with verified shoppers and importers across Ethiopia including Addis Ababa, Dire Dawa, Hawassa, Bahir Dar, Mekelle, Adama, and beyond.',
      },
      {
        q: 'Is KelalShop free to use?',
        a: 'Yes, creating a KelalShop account is completely free. You can browse products, post buying requests, and connect with verified shoppers at no cost.',
      },
      {
        q: 'What makes KelalShop different from other Ethiopian e-commerce platforms?',
        a: 'KelalShop is unique because we allow you to buy from international stores like AliExpress, Shein, and Amazon using Ethiopian Birr (ETB), through our network of verified local shoppers. Every shopper is identity-verified and rated by real buyers.',
      },
    ],
  },
  {
    id: 'ordering',
    label: 'Ordering & Products',
    icon: ShoppingBag,
    color: 'bg-blue-50 text-blue-600',
    questions: [
      {
        q: 'How do I place an order on KelalShop?',
        a: 'Simply browse products, click "Buy Now" or "Add to Cart", select your preferred verified shopper, and confirm your order. You then coordinate with the shopper for payment and delivery details.',
      },
      {
        q: 'Can I request a product that is not listed?',
        a: 'Yes! Use our "Post a Request" feature at kelalshop.com/requests/new. Describe what you want to buy, set your budget, and verified shoppers in our network will respond with offers.',
      },
      {
        q: 'What international stores can I shop from through KelalShop?',
        a: 'Through our verified shoppers, you can order from AliExpress, Shein, Amazon, ASOS, Zara, Alibaba, eBay, Temu, and many more international stores — all delivered to Ethiopia.',
      },
      {
        q: 'How do I know if a product is authentic?',
        a: 'Our verified shoppers provide real product photos, receipts, and shipping tracking. Every shopper has a public trust score and buyer reviews visible on their profile page.',
      },
    ],
  },
  {
    id: 'payment',
    label: 'Payments',
    icon: CreditCard,
    color: 'bg-emerald-50 text-emerald-600',
    questions: [
      {
        q: 'What payment methods are accepted on KelalShop?',
        a: 'KelalShop accepts CBE Birr and Telebirr for local ETB payments. Payments are made directly to your verified shopper after placing your order. We do not process payments directly — we facilitate the connection.',
      },
      {
        q: 'Do I pay in Ethiopian Birr (ETB)?',
        a: 'Yes! All prices on KelalShop are displayed and paid in Ethiopian Birr (ETB). Your shopper handles the international currency conversion for you.',
      },
      {
        q: 'When do I pay for my order?',
        a: 'Payment timing is agreed upon between you and the shopper, typically a deposit upfront and the remainder upon delivery. All terms are communicated before you commit.',
      },
      {
        q: 'Is my payment secure on KelalShop?',
        a: 'All transactions are arranged directly with your verified shopper, who has been identity-verified by our team. We recommend using CBE Birr or Telebirr for digital records of your payment.',
      },
      {
        q: 'Does KelalShop support escrow payments?',
        a: 'Not at the moment. Currently, buyers arrange payments directly with verified shoppers. However, we plan to launch a secure escrow payment protection system in a future update to make transactions even safer.',
      },
    ],
  },
  {
    id: 'delivery',
    label: 'Delivery & Shipping',
    icon: Truck,
    color: 'bg-purple-50 text-purple-600',
    questions: [
      {
        q: 'How long does delivery take?',
        a: 'Delivery times vary by product and origin country. Standard international shipping from China takes 15–30 days. Express shipping options (7–14 days) may be available at extra cost. Your shopper will give you an estimated delivery date at the time of order.',
      },
      {
        q: 'Can I track my order?',
        a: 'Yes. Your verified shopper will provide you with shipping tracking information once your item has been dispatched. You can also message your shopper anytime through the built-in KelalShop chat.',
      },
      {
        q: 'What happens if my item does not arrive?',
        a: 'If your item does not arrive within the agreed timeframe, contact your shopper through our chat system immediately. You can also reach our support team at support@kelalshop.com and we will assist in resolving the issue.',
      },
      {
        q: 'Do you deliver to cities outside Addis Ababa?',
        a: 'Yes! Our network of shoppers delivers across Ethiopia including Dire Dawa, Hawassa, Adama, Bahir Dar, Gondar, Jimma, and other major cities. Delivery fees and timelines may vary by location.',
      },
    ],
  },
  {
    id: 'shoppers',
    label: 'Verified Shoppers',
    icon: Users,
    color: 'bg-rose-50 text-rose-600',
    questions: [
      {
        q: 'What is a "Verified Shopper" on KelalShop?',
        a: 'A Verified Shopper is an individual or business that has passed our identity verification process. They purchase items internationally on your behalf and deliver them to you in Ethiopia. Each shopper has a public profile with ratings and reviews.',
      },
      {
        q: 'How do I become a Verified Shopper on KelalShop?',
        a: 'Sign up at kelalshop.com/auth/signup, select the "Shopper" role, and submit your identity verification documents. Our team reviews applications within 2–3 business days.',
      },
      {
        q: 'How are shoppers rated?',
        a: 'Buyers leave star ratings and written reviews after each completed order. Shoppers build a public Trust Score based on successful deliveries, response time, and overall buyer satisfaction.',
      },
      {
        q: 'Can I choose which shopper to work with?',
        a: 'Yes! You can browse all verified shoppers at kelalshop.com/shoppers, view their profiles, specialties, pricing, and reviews, then contact the shopper that best fits your needs.',
      },
    ],
  },
  {
    id: 'safety',
    label: 'Safety & Trust',
    icon: Shield,
    color: 'bg-indigo-50 text-indigo-600',
    questions: [
      {
        q: 'How does KelalShop protect buyers?',
        a: 'We protect buyers through our verified shopper program (identity checks), a public rating and review system, an in-app chat with message history, and dedicated support for dispute resolution.',
      },
      {
        q: 'What if I have a dispute with a shopper?',
        a: 'Contact our support team at support@kelalshop.com or via Telegram. We mediate disputes between buyers and shoppers and work to ensure a fair resolution for both parties.',
      },
      {
        q: 'Is my personal data safe with KelalShop?',
        a: 'Yes. KelalShop uses industry-standard encryption (SSL/TLS) and secure authentication. We never sell your personal data. Read our full Privacy Policy at kelalshop.com/privacy.',
      },
    ],
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-navy-900 group-hover:text-amber-600 transition-colors">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-amber-500' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96 pb-5' : 'max-h-0'}`}
      >
        <p className="text-slate-600 leading-relaxed text-sm">{answer}</p>
      </div>
    </div>
  )
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('general')
  const active = FAQ_CATEGORIES.find((c) => c.id === activeCategory)!

  // JSON-LD structured data for Google FAQ rich results
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_CATEGORIES.flatMap((cat) =>
      cat.questions.map((q) => ({
        '@type': 'Question',
        name: q.q,
        acceptedAnswer: { '@type': 'Answer', text: q.a },
      }))
    ),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-slate-50">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 py-20 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-amber-400 rounded-full blur-[120px]" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-amber-500/30">
              <HelpCircle className="w-4 h-4" />
              Help Center
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
              Frequently Asked <span className="text-amber-400">Questions</span>
            </h1>
            <p className="text-lg text-navy-300 max-w-2xl mx-auto">
              Everything you need to know about buying and selling on Ethiopia's leading online marketplace.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Category Sidebar */}
            <aside className="lg:w-64 shrink-0">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sticky top-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">Categories</p>
                <nav className="space-y-1">
                  {FAQ_CATEGORIES.map((cat) => {
                    const Icon = cat.icon
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          activeCategory === cat.id
                            ? 'bg-amber-50 text-amber-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {cat.label}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </aside>

            {/* FAQ Content */}
            <main className="flex-1">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active.color}`}>
                    <active.icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-navy-900">{active.label}</h2>
                  <span className="ml-auto text-xs text-slate-400 font-medium bg-slate-100 px-3 py-1 rounded-full">
                    {active.questions.length} questions
                  </span>
                </div>

                <div>
                  {active.questions.map((item, i) => (
                    <FAQItem key={i} question={item.q} answer={item.a} />
                  ))}
                </div>
              </div>

              {/* Still need help CTA */}
              <div className="mt-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-8 text-white text-center">
                <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
                <p className="text-amber-100 mb-6 text-sm">
                  Our support team is available Monday–Friday, 9am–6pm EAT.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-white text-amber-600 font-bold px-6 py-3 rounded-xl hover:bg-amber-50 transition-colors shadow-sm"
                >
                  Contact Support
                </Link>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
