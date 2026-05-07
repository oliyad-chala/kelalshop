import Link from 'next/link'

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
            
            {/* Social Icons */}
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-amber-500 hover:text-navy-950 transition-all text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-amber-500 hover:text-navy-950 transition-all text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.20 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-amber-500 hover:text-navy-950 transition-all text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-amber-500 hover:text-navy-950 transition-all text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 008.21 11.387c.6.111.82-.26.82-.577v-2.165c-3.338.726-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22v3.293c0 .319.22.694.825.576A12 12 0 0024 12a12 12 0 00-12.056-12z"/></svg>
              </a>
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

          {/* Customer Service */}
          <div>
            <h4 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">Help Center</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-amber-500 hover:translate-x-1 inline-block transition-all">How it Works</Link></li>
              <li><Link href="#" className="hover:text-amber-500 hover:translate-x-1 inline-block transition-all">Trust & Safety</Link></li>
              <li><Link href="#" className="hover:text-amber-500 hover:translate-x-1 inline-block transition-all">Escrow Protection</Link></li>
              <li><Link href="#" className="hover:text-amber-500 hover:translate-x-1 inline-block transition-all">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        {/* Payment Methods & Trust Badges */}
        <div className="border-t border-white/10 pt-8 mt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm text-navy-400">
            <span className="font-medium text-white">Accepted Payments:</span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="h-8 px-3 bg-white rounded flex items-center justify-center text-xs font-bold text-slate-800 tracking-tight">CBE Birr</div>
              <div className="h-8 px-3 bg-[#00AEEF] rounded flex items-center justify-center text-xs font-bold text-white tracking-tight">Telebirr</div>
              <div className="h-8 px-3 bg-white rounded flex items-center justify-center text-xs font-bold text-[#1434CB] tracking-tight"><i>VISA</i></div>
              <div className="h-8 px-3 bg-slate-800 rounded border border-slate-600 flex items-center justify-center text-xs font-bold text-white tracking-tight">Mastercard</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-full border border-emerald-500/20 text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            Secure Escrow Protection
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-navy-500">
          <p>© {new Date().getFullYear()} KelalShop. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
