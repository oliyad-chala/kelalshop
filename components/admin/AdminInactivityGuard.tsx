'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { adminSignOut } from '@/lib/actions/admin-auth'

const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const WARNING_MS = 5 * 60 * 1000  // Warn 5 minutes before

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']

export function AdminInactivityGuard() {
  const router = useRouter()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
  }, [])

  const resetTimer = useCallback(() => {
    clearTimers()

    warningRef.current = setTimeout(() => {
      // Could show a toast/banner here warning the admin they'll be signed out soon
      console.warn('[Admin] Session expiring in 5 minutes due to inactivity.')
    }, TIMEOUT_MS - WARNING_MS)

    timeoutRef.current = setTimeout(async () => {
      await adminSignOut()
    }, TIMEOUT_MS)
  }, [clearTimers])

  useEffect(() => {
    resetTimer()

    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true })
    })

    return () => {
      clearTimers()
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, resetTimer)
      })
    }
  }, [resetTimer, clearTimers])

  return null
}
