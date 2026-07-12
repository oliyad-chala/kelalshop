'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgressBar() {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight > 0) {
        const scrolled = (window.scrollY / scrollHeight) * 100
        setWidth(scrolled)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className="fixed top-0 left-0 h-1 bg-amber-500 z-50 transition-all duration-75"
      style={{ width: `${width}%` }}
    />
  )
}
