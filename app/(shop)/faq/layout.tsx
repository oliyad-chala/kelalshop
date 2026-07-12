import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'FAQ — Frequently Asked Questions | KelalShop',
  description:
    'Find answers to the most common questions about KelalShop — Ethiopia\'s best online shopping marketplace. Learn about ordering, payments in ETB, delivery, and verified shoppers.',
  alternates: {
    canonical: `${SITE_URL}/faq`,
  },
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children
}
