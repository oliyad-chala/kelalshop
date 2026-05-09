'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { signOut } from '@/lib/actions/auth'
import { useCart } from '@/lib/context/CartContext'
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
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [activeMegaCategory, setActiveMegaCategory] = useState('electronics')
  const [selectedCategory, setSelectedCategory] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { totalItems, openCart } = useCart()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMegaMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const MEGA_CATEGORIES = [
    {
      id: 'electronics',
      name: 'Electronics & Tech',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      subcategories: [
        { id: 'phones', name: 'Phones & Accessories', icon: '📱' },
        { id: 'computers', name: 'Laptops & Computers', icon: '💻' },
        { id: 'audio', name: 'Audio & Headphones', icon: '🎧' },
        { id: 'wearables', name: 'Smart Watches', icon: '⌚' }
      ]
    },
    {
      id: 'fashion',
      name: 'Fashion & Beauty',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
        </svg>
      ),
      subcategories: [
        { id: 'clothing', name: 'Clothing & Apparel', icon: '👕' },
        { id: 'shoes', name: 'Footwear', icon: '👟' },
        { id: 'cosmetics', name: 'Cosmetics', icon: '💄' },
        { id: 'jewelry', name: 'Jewelry & Watches', icon: '⌚' }
      ]
    },
    {
      id: 'home',
      name: 'Home & Living',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      subcategories: [
        { id: 'furniture', name: 'Furniture', icon: '🛋️' },
        { id: 'kitchen', name: 'Kitchen & Dining', icon: '🍳' },
        { id: 'decor', name: 'Home Decor', icon: '🖼️' },
        { id: 'bedding', name: 'Bedding', icon: '🛏️' }
      ]
    },
    {
      id: 'vehicles',
      name: 'Vehicles & Parts',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      subcategories: [
        { id: 'accessories', name: 'Car Accessories', icon: '🚗' },
        { id: 'parts', name: 'Replacement Parts', icon: '⚙️' },
        { id: 'electronics', name: 'Car Electronics', icon: '📻' },
        { id: 'tools', name: 'Tools & Equipment', icon: '🔧' }
      ]
    }
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim() || selectedCategory) {
      let url = `/products?q=${encodeURIComponent(searchQuery)}`
      if (selectedCategory) url += `&category=${selectedCategory}`
      router.push(url)
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
              className="flex w-full rounded-full border-[1.5px] border-amber-500 bg-white focus-within:ring-4 focus-within:ring-amber-500/20 transition-all shadow-sm relative"
            >
              <div className="relative hidden md:flex items-center border-r border-slate-200 shrink-0 h-full" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                  className="bg-transparent px-4 text-sm font-medium text-slate-600 focus:outline-none w-44 hover:bg-slate-50 flex items-center justify-between h-full rounded-l-full cursor-pointer"
                >
                  <span className="truncate pr-2 font-semibold">
                    {MEGA_CATEGORIES.flatMap(c => c.subcategories).find(sub => sub.id === selectedCategory)?.name 
                      || MEGA_CATEGORIES.find(c => c.id === selectedCategory)?.name 
                      || 'All Categories'}
                  </span>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Mega Menu Dropdown */}
                {megaMenuOpen && (
                  <div className="absolute top-full left-0 mt-3 w-[600px] bg-white border border-slate-100 shadow-2xl rounded-2xl z-50 flex overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {/* Left Column: Categories */}
                    <div className="w-[35%] bg-slate-50 border-r border-slate-100 p-2 flex flex-col gap-1">
                      {MEGA_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onMouseEnter={() => setActiveMegaCategory(cat.id)}
                          onClick={() => {
                            setSelectedCategory(cat.id)
                            setMegaMenuOpen(false)
                            router.push(`/products?category=${cat.id}`)
                          }}
                          className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-colors ${activeMegaCategory === cat.id ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100/80'}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={activeMegaCategory === cat.id ? 'text-amber-500' : 'text-slate-400'}>{cat.icon}</span>
                            <span className="truncate text-left">{cat.name}</span>
                          </div>
                          <svg className="w-4 h-4 opacity-50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                    {/* Right Column: Subcategories */}
                    <div className="w-[65%] p-6 bg-white min-h-[300px]">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                        <div className="font-extrabold text-navy-950 text-lg tracking-tight">
                          {MEGA_CATEGORIES.find(c => c.id === activeMegaCategory)?.name}
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedCategory(activeMegaCategory)
                            setMegaMenuOpen(false)
                            router.push(`/products?category=${activeMegaCategory}`)
                          }}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
                        >
                          View All →
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {MEGA_CATEGORIES.find(c => c.id === activeMegaCategory)?.subcategories.map(sub => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(sub.id)
                              setMegaMenuOpen(false)
                              router.push(`/products?category=${sub.id}`)
                            }}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all text-left group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-xl group-hover:bg-amber-100 group-hover:scale-110 transition-transform shrink-0 shadow-sm">
                              {sub.icon}
                            </div>
                            <span className="text-sm font-semibold text-slate-700 group-hover:text-amber-700 leading-tight">
                              {sub.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="Search products, brands, and categories..."
                className="flex-1 px-5 py-2.5 text-sm text-navy-900 placeholder-slate-400 focus:outline-none rounded-r-full md:rounded-none"
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

            {/* Quick Sell Button (Desktop) */}
            {(!user || user.role === 'shopper' || user.role === 'admin') && (
              <Link 
                href={user ? "/dashboard/listings/new" : "/auth/login?redirectTo=/dashboard/listings/new"} 
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md border border-navy-800"
              >
                <span className="text-amber-400">★</span>
                Sell
              </Link>
            )}

            {/* Favorites icon */}
            <Link
              href="/favorites"
              className="relative text-slate-700 hover:text-amber-500 transition-colors p-1.5 group"
              aria-label="My Favorites"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {/* Cart icon — opens drawer */}
            <button
              onClick={openCart}
              className="relative text-slate-700 hover:text-amber-500 transition-colors p-1.5 group"
              aria-label="Open cart"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[1.1rem] px-1 bg-red-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center leading-none">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

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
                          href={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                        >
                          <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          {user.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
                        </Link>
                        {user.role !== 'admin' && (
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
                        )}
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

          {/* Mobile Categories */}
          <div className="pt-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Browse Categories</p>
            <div className="grid grid-cols-2 gap-2">
              {MEGA_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setMenuOpen(false)
                    router.push(`/products?category=${cat.id}`)
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-amber-50 border border-slate-100 text-left transition-colors"
                >
                  <span className="text-amber-500 shrink-0">{cat.icon}</span>
                  <span className="text-sm font-semibold text-navy-900 truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nav links */}
          <div className="border-t border-slate-100 pt-3 space-y-1">
            {(!user || user.role === 'shopper' || user.role === 'admin') && (
              <Link
                href={user ? "/dashboard/listings/new" : "/auth/login?redirectTo=/dashboard/listings/new"}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-white bg-navy-900 hover:bg-navy-800 transition-colors shadow-sm mb-2"
              >
                <span className="text-amber-400">★</span>
                Sell on KelalShop
              </Link>
            )}
            
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
