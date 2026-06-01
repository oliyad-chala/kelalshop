import Link from 'next/link'
import { SUPPORT_TELEGRAM } from '@/lib/content/legal'

const SOCIAL_LINKS = [
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@kelalshop',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
      </svg>
    ),
  },
  {
    label: 'Telegram',
    href: SUPPORT_TELEGRAM,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/kelalshop',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
      </svg>
    ),
  },
] as const

export function Footer() {
  return (
    <footer className="bg-navy-950 text-navy-300 mt-auto">
      {/* Pre-Footer Newsletter Section */}
      <div className="border-b border-white/10 bg-navy-900/50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left max-w-xl">
              <h3 className="text-2xl font-bold text-white mb-2">Subscribe to our Newsletter</h3>
              <p className="text-navy-300 text-sm">Get the latest updates on new products, verified shoppers, and exclusive marketplace deals delivered to your inbox.</p>
            </div>
            <form className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email address"
                className="w-full sm:w-80 px-4 py-3 rounded-xl bg-navy-800/50 border border-white/10 text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold transition-colors whitespace-nowrap shadow-sm"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand & Social */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold text-white tracking-tight">
                Kelal<span className="text-amber-500">Shop</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-navy-400 mb-6 max-w-md">
              Connecting Ethiopian buyers with verified local shoppers and global importers. Shop the world, pay locally with complete peace of mind.
            </p>

            <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-3">Follow us</p>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`KelalShop on ${social.label}`}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-amber-500 hover:text-navy-950 transition-all text-white"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">Marketplace</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/products" className="hover:text-amber-500 hover:translate-x-1 inline-block transition-all">Browse Products</Link></li>
              <li><Link href="/shoppers" className="hover:text-amber-500 hover:translate-x-1 inline-block transition-all">Find Shoppers</Link></li>
              <li><Link href="/requests" className="hover:text-amber-500 hover:translate-x-1 inline-block transition-all">Buyer Requests</Link></li>
              <li><Link href="/requests/new" className="hover:text-amber-500 hover:translate-x-1 inline-block transition-all">Post a Request</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">Account</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/auth/signup" className="hover:text-amber-500 hover:translate-x-1 inline-block transition-all">Join as Buyer</Link></li>
              <li><Link href="/auth/signup" className="hover:text-amber-500 hover:translate-x-1 inline-block transition-all">Become a Shopper</Link></li>
              <li><Link href="/dashboard" className="hover:text-amber-500 hover:translate-x-1 inline-block transition-all">Dashboard</Link></li>
              <li><Link href="/auth/login" className="hover:text-amber-500 hover:translate-x-1 inline-block transition-all">Sign In</Link></li>
            </ul>
          </div>

          {/* Help Center */}
          <div>
            <h4 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">Help Center</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={SUPPORT_TELEGRAM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-500 hover:translate-x-1 inline-block transition-all"
                >
                  Contact Us (Telegram)
                </a>
              </li>
              <li><Link href="/privacy" className="hover:text-amber-500 hover:translate-x-1 inline-block transition-all">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-amber-500 hover:translate-x-1 inline-block transition-all">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-white/10 pt-8 mt-8">
          <div className="flex flex-col gap-3 text-sm text-navy-400">
            <span className="font-medium text-white">Accepted Payments</span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-8 px-3 bg-white rounded flex items-center justify-center text-xs font-bold text-slate-800 tracking-tight">CBE Birr</div>
              <div className="h-8 px-3 bg-[#00AEEF] rounded flex items-center justify-center text-xs font-bold text-white tracking-tight">Telebirr</div>
            </div>
            <p className="text-xs text-navy-500 max-w-xl">
              Pay shoppers via CBE Birr or Telebirr after placing your order. Payment is arranged directly with the seller.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-navy-500">
          <p>© {new Date().getFullYear()} KelalShop. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-amber-500 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-amber-500 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
