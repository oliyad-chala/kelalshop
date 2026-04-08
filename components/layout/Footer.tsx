import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-navy-950 text-navy-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block mb-3">
              <span className="text-xl font-bold text-white">
                Kelal<span className="text-amber-400">Shop</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-navy-400">
              Connecting Ethiopian buyers with verified local shoppers and importers.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Marketplace</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/products" className="hover:text-white transition-colors">Browse Products</Link></li>
              <li><Link href="/shoppers" className="hover:text-white transition-colors">Find Shoppers</Link></li>
              <li><Link href="/requests" className="hover:text-white transition-colors">Buyer Requests</Link></li>
              <li><Link href="/requests/new" className="hover:text-white transition-colors">Post a Request</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Account</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/auth/signup" className="hover:text-white transition-colors">Join as Buyer</Link></li>
              <li><Link href="/auth/signup" className="hover:text-white transition-colors">Become a Shopper</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>

          {/* Sources */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Import Sources</h4>
            <ul className="space-y-2.5 text-sm">
              <li><span>AliExpress</span></li>
              <li><span>Shein</span></li>
              <li><span>Amazon</span></li>
              <li><span>Temu</span></li>
              <li><span>Local Markets</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-navy-500">
          <p>© {new Date().getFullYear()} KelalShop. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Made with ❤️ in Ethiopia</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
