import { LegalPage } from '@/components/legal/LegalPage'
import { refundPolicy } from '@/lib/content/legal'
import { SITE_NAME, SITE_URL } from '@/lib/seo/site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Return & Refund Policy | KelalShop',
  description: `Learn how returns, replacements, and buyer protection refunds work on ${SITE_NAME}.`,
  alternates: {
    canonical: `${SITE_URL}/refund`,
  },
}

export default function RefundPage() {
  return (
    <LegalPage
      title="Return & Refund Policy"
      intro={`This policy outlines inspection guidelines, eligible returns, and buyer protection resolution for ${SITE_NAME} transactions.`}
      sections={refundPolicy}
    />
  )
}
