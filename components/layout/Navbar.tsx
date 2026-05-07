'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { signOut } from '@/lib/actions/auth'
import type { Profile } from '@/types/app.types'

interface NavbarProps {
  user?: Profile | null
}

const navLinks = [
  { href: '/products', label: 'Discover Products', icon: '✨' },
  { href: '/shoppers', label: 'Top Shoppers', icon: '⭐' },
]

export function Navbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery)}`)
      setMenuOpen(false)
    }
  }

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm relative">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">

        {/* Main Header Row */}
        <div className="h-16 sm:h-20 flex items-center justify-between gap-3 lg:gap-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl sm:text-2xl font-bold text-navy-900 tracking-tight">
              Kelal<span className="text-amber-500">Shop</span>
            </span>
          </Link>

          {/* Search Bar — visible from sm breakpoint */}
          <div className="hidden sm:flex flex-1 max-w-3xl justify-center">
            <form
              onSubmit={handleSearch}
              className="flex w-full overflow-hidden rounded-full border-[1.5px] border-amber-500 bg-white focus-within:ring-4 focus-within:ring-amber-500/20 transition-all shadow-sm"
            >
              <select className="bg-transparent border-r border-slate-200 px-4 text-sm font-medium text-slate-600 focus:outline-none hidden md:block w-36 hover:bg-slate-50 cursor-pointer">
                <option value="">All Category</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="home">Home &amp; Living</option>
                <option value="beauty">Beauty</option>
              </select>
              <input
                type="text"
                placeholder="Search products, brands, and categories..."
                className="flex-1 px-5 py-2.5 text-sm text-navy-900 placeholder-slate-400 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-navy-950 px-5 transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">

            {/* Cart icon */}
            <Link href="/dashboard/orders" className="relative text-slate-700 hover:text-amber-500 transition-colors p-1.5 group">
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </Link>

            {/* Mobile search button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Search"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 rounded-full pl-1 pr-1 h-9 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                >
                  <Avatar src={user.avatar_url} name={user.full_name ?? 'User'} size="sm" />
                  <span className="hidden xl:block text-sm text-navy-900 font-semibold max-w-[100px] truncate">
                    {user.full_name ?? 'User'}
                  </span>
                  <svg className="w-4 h-4 text-slate-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <>
                    {/* Backdrop to close menu */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden fade-in">
                      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-sm font-bold text-navy-900 truncate">{user.full_name}</p>
                        <p className="text-xs text-amber-600 font-medium capitalize mt-0.5">{user.role}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                        >
                          <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Dashboard
                        </Link>
                        <Link
                          href="/dashboard/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                        >
                          <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile Settings
                        </Link>
                      </div>
                      <div className="border-t border-slate-100 p-2">
                        <form action={signOut}>
                          <button
                            type="submit"
                            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
                          >
                            <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                          </button>
                        </form>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/auth/signup">
                  <Button variant="outline" size="sm" className="rounded-full font-semibold text-navy-900 border-slate-200 hover:bg-slate-50 hover:border-slate-300">
                    Sign up
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="primary" size="sm" className="rounded-full shadow-md font-semibold bg-amber-500 hover:bg-amber-400 text-navy-950 px-5">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button (hamburger) — shown only when logged out on mobile */}
            {!user && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="sm:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {menuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  }
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Navigation Row (Desktop) */}
      <div className="hidden md:block w-full border-t border-slate-100 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-11 flex items-center justify-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors py-2 border-b-2 border-transparent hover:border-amber-500"
            >
              <span className="opacity-70">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile dropdown — search + nav links + auth buttons */}
      {menuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl p-4 space-y-4 z-50">
          {/* Mobile search form */}
          <form onSubmit={handleSearch} className="flex overflow-hidden rounded-xl border border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30">
            <input
              type="text"
              placeholder="Search products..."
              className="flex-1 px-4 py-3 text-sm text-navy-900 placeholder-slate-400 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-navy-950 px-4 transition-colors flex items-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Nav links */}
          <div className="border-t border-slate-100 pt-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-navy-900 hover:bg-amber-50 hover:text-amber-600 transition-colors"
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth buttons when logged out */}
          {!user && (
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <Link href="/auth/signup" className="flex-1" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" size="sm" fullWidth className="rounded-xl border-slate-200 text-navy-900 h-11">
                  Sign Up
                </Button>
              </Link>
              <Link href="/auth/login" className="flex-1" onClick={() => setMenuOpen(false)}>
                <Button variant="primary" size="sm" fullWidth className="rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 font-semibold h-11">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
