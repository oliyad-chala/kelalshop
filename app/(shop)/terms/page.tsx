import { LegalPage } from '@/components/legal/LegalPage'
import { termsOfService } from '@/lib/content/legal'
import { SITE_NAME, SITE_URL } from '@/lib/seo/site'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `Rules and conditions for using the ${SITE_NAME} marketplace.`,
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={`Please read these terms carefully before using ${SITE_NAME}.`}
      sections={termsOfService}
    />
  )
}
