'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY = 'kelalshop_pwa_dismissed_at'
const SESSION_DISMISS_KEY = 'kelalshop_pwa_session_dismissed'
const DISMISS_DAYS = 30 // Keep dismissed for 30 days once closed

export function PwaInstallPrompt() {
  const pathname = usePathname()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)
  const [, setIsInstalled] = useState(false)

  // 1. Never show on dashboard, admin, or auth screens (seller/admin management areas)
  const isExcludedRoute =
    !pathname ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth')

  useEffect(() => {
    // Register Service Worker in background
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope)
        })
        .catch((error) => {
          console.warn('[PWA] Service Worker registration failed:', error)
        })
    }

    // Do not trigger prompt checks if running in standalone PWA or on an excluded route
    if (isExcludedRoute) return

    // Check if already running standalone
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true

    if (isRunningStandalone) {
      setIsStandalone(true)
      return
    }

    // Check session dismissal (if user closed it during this browsing session)
    try {
      if (sessionStorage.getItem(SESSION_DISMISS_KEY) === 'true') {
        return
      }
    } catch {
      // Ignore storage error
    }

    // Check long-term dismissal history (30 days)
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY)
      if (dismissedAt) {
        const daysSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24)
        if (daysSinceDismiss < DISMISS_DAYS) {
          return
        }
      }
    } catch {
      // Ignore storage error
    }

    // Detect mobile device
    const ua = window.navigator.userAgent.toLowerCase()
    const isMobileDevice = /iphone|ipad|ipod|android|mobile/.test(ua)
    const isIosDevice = /iphone|ipad|ipod/.test(ua)
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios|android/.test(ua)

    // On desktop, don't show the mobile install prompt
    if (!isMobileDevice && window.innerWidth >= 768) {
      return
    }

    if (isIosDevice) {
      setIsIos(true)
      // On iOS Safari, show politely after 12 seconds
      if (isSafari) {
        const timer = setTimeout(() => {
          setIsVisible(true)
        }, 12000)
        return () => clearTimeout(timer)
      }
    }

    // Handle Android / Chromium `beforeinstallprompt`
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Professional delay: 12 seconds so the user can browse comfortably first
      setTimeout(() => {
        setIsVisible(true)
      }, 12000)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsVisible(false)
      setDeferredPrompt(null)
      try {
        localStorage.setItem('kelalshop_pwa_installed', 'true')
      } catch {
        // Ignore storage error
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isExcludedRoute])

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true)
      return
    }

    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setIsInstalled(true)
        setIsVisible(false)
      }
      setDeferredPrompt(null)
    } catch (err) {
      console.error('[PWA] Error launching prompt:', err)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setShowIosGuide(false)
    try {
      // Remember dismissal for 30 days & across this entire browser session
      localStorage.setItem(DISMISS_KEY, Date.now().toString())
      sessionStorage.setItem(SESSION_DISMISS_KEY, 'true')
    } catch (err) {
      console.warn('[PWA] Storage access failed on dismiss:', err)
    }
  }

  // Hide if standalone, excluded page, or not yet visible
  if (isExcludedRoute || isStandalone || !isVisible) {
    return null
  }

  return (
    <>
      {/* 
        Non-blocking Floating Bottom App Install Banner:
        - `pointer-events-none` on outer wrapper so touches/clicks pass directly to the page
        - `pointer-events-auto` on the card only
        - `touchAction: pan-y` so vertical swipe gestures to scroll are NEVER blocked
        - `md:hidden` hides it on desktop browsers
      */}
      <aside
        aria-label="App installation notification"
        className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none md:hidden"
        style={{
          position: 'fixed',
          bottom: '1rem',
          left: 0,
          right: 0,
          zIndex: 40,
        }}
      >
        <div
          className="pointer-events-auto relative flex w-full max-w-md items-center justify-between gap-3 rounded-2xl bg-slate-900/95 p-3 text-white shadow-2xl backdrop-blur-md ring-1 ring-white/10"
          style={{ touchAction: 'pan-y' }}
        >
          {/* Kelalshop Logo */}
          <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/5 p-1 shadow-inner">
            <Image
              src="/icons/icon-192.png"
              alt="Kelalshop App"
              width={44}
              height={44}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Text Description */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-bold text-white">KelalShop App</p>
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-amber-400">
                FAST & FREE
              </span>
            </div>
            <p className="truncate text-[11px] text-slate-300">
              Install to your phone for faster shopping
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-500/30 transition hover:from-amber-600 hover:to-orange-600 active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install</span>
            </button>

            <button
              onClick={handleDismiss}
              aria-label="Close install prompt"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* iOS Safari Guided Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 ring-1 ring-slate-900/5">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Install on iPhone / iPad</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Takes less than 5 seconds</p>
              </div>
            </div>

            <div className="mt-5 space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  1
                </span>
                <span className="flex items-center gap-1.5">
                  Tap the <strong className="inline-flex items-center gap-1 text-sky-600"><Share className="h-3.5 w-3.5" /> Share</strong> icon at the bottom of Safari
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  2
                </span>
                <span className="flex items-center gap-1.5">
                  Scroll down & select <strong className="inline-flex items-center gap-1 text-slate-900 dark:text-white"><PlusSquare className="h-3.5 w-3.5" /> Add to Home Screen</strong>
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  3
                </span>
                <span className="flex items-center gap-1.5">
                  Tap <strong className="text-slate-900 dark:text-white">Add</strong> in the top-right corner. Done!
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}
