import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import './globals.css'
import type { Profile } from '@/types/app.types'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

// Ensures colors match theme
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  
  // Fetch user object directly to provide to Navbar
  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data as Profile | null
  }

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh flex flex-col bg-slate-50 antialiased selection:bg-amber-200 selection:text-amber-900">
        <Navbar user={profile} />
        {children}
        <Footer />
      </body>
    </html>
  )
}
