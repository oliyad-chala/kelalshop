'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Download, X, Share, PlusSquare, Smartphone, Check } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY = 'kelalshop_pwa_dismissed_at'
const DISMISS_DAYS = 5

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // 1. Register Service Worker
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

    // 2. Check if already installed & running in standalone mode
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true

    if (isRunningStandalone) {
      setIsStandalone(true)
      return
    }

    // 3. Check dismissal history
    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismiss < DISMISS_DAYS) {
        return
      }
    }

    // 4. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(ua)
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios|android/.test(ua)

    if (isIosDevice) {
      setIsIos(true)
      // On iOS Safari, show prompt after a short delay so user has a chance to see the page first
      if (isSafari) {
        const timer = setTimeout(() => {
          setIsVisible(true)
        }, 3500)
        return () => clearTimeout(timer)
      }
    }

    // 5. Handle Android / Chromium `beforeinstallprompt`
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Slight delay for a smoother user experience
      setTimeout(() => {
        setIsVisible(true)
      }, 2000)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsVisible(false)
      setDeferredPrompt(null)
      localStorage.setItem('kelalshop_pwa_installed', 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

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
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
  }

  if (isStandalone || !isVisible) {
    return null
  }

  return (
    <>
      {/* Floating Bottom App Install Banner */}
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="relative flex items-center justify-between gap-3 rounded-2xl bg-slate-900/95 p-3.5 text-white shadow-2xl backdrop-blur-md ring-1 ring-white/10 sm:p-4">
          {/* Kelalshop Logo */}
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/5 p-1 shadow-inner">
            <Image
              src="/icons/icon-192.png"
              alt="Kelalshop App"
              width={48}
              height={48}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Text Description */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-bold text-white">KelalShop App</p>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-400">
                FAST & FREE
              </span>
            </div>
            <p className="truncate text-xs text-slate-300">
              Install to your phone for faster shopping & deals
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/30 transition hover:from-amber-600 hover:to-orange-600 active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install</span>
            </button>

            <button
              onClick={handleDismiss}
              aria-label="Dismiss app install banner"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

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
