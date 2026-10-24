'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PhoneReminderBannerProps {
  userRole?: string
}

export function PhoneReminderBanner({ userRole = 'buyer' }: PhoneReminderBannerProps) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('kelal_phone_reminder_dismissed') === 'true'
    setDismissed(isDismissed)
  }, [])

  function handleDismiss() {
    sessionStorage.setItem('kelal_phone_reminder_dismissed', 'true')
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div className="mb-6 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 via-amber-50/60 to-orange-50/40 p-4 sm:p-5 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
              Add your phone number
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Action Required
              </span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
              {userRole === 'shopper'
                ? 'Buyers and admins need your phone number to coordinate orders and verify deliveries.'
                : 'Verified sellers need your phone number to call or message you with quotes, offers, and delivery updates.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            Remind Later
          </button>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-all shadow-sm shadow-amber-500/20 active:scale-95"
          >
            Add Phone Number
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
