import { LegalPage } from '@/components/legal/LegalPage'
import { privacyPolicy } from '@/lib/content/legal'
import { SITE_NAME, SITE_URL } from '@/lib/seo/site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${SITE_NAME} collects, uses, and protects your personal information.`,
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This policy describes how ${SITE_NAME} handles your data when you use our Ethiopian marketplace.`}
      sections={privacyPolicy}
    />
  )
}
