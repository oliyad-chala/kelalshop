'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

type Props = { endDate: string }

export function CampaignCountdown({ endDate }: Props) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const targetDate = new Date(endDate).getTime()

    const tick = () => {
      const difference = targetDate - Date.now()
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      })
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [endDate])

  return (
    <div className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-full font-mono text-sm font-medium">
      <Clock className="w-4 h-4 mr-1" />
      <span>{String(timeLeft.days).padStart(2, '0')}d</span>
      <span>:</span>
      <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
      <span>:</span>
      <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
      <span>:</span>
      <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
    </div>
  )
}
