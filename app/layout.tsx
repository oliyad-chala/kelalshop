import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#1a1f36',
}

export const metadata: Metadata = {
  title: {
    default: 'KelalShop — Ethiopian Marketplace',
    template: '%s | KelalShop',
  },
  description:
    'Connect with verified local shoppers and importers. Buy anything from AliExpress, Shein, Amazon and more — delivered across Ethiopia.',
  keywords: ['marketplace', 'Ethiopia', 'shopping', 'import', 'AliExpress', 'Shein'],
  openGraph: {
    siteName: 'KelalShop',
    type: 'website',
  },
}

/**
 * Thin root layout — provides <html> and <body> only.
 * Section-specific UI (Navbar, Admin sidebar) is added by nested route-group layouts:
 *   app/(shop)/layout.tsx  → buyer shop
 *   app/(admin)/layout.tsx → admin portal
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
