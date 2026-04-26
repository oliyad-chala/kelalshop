'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem('admin-theme')
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme')
      setIsLight(true)
    }
  }, [])

  const toggleTheme = () => {
    if (isLight) {
      document.body.classList.remove('light-theme')
      localStorage.setItem('admin-theme', 'dark')
      setIsLight(false)
    } else {
      document.body.classList.add('light-theme')
      localStorage.setItem('admin-theme', 'light')
      setIsLight(true)
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="admin-btn admin-btn-ghost"
      style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', marginTop: '0.4rem' }}
      title="Toggle light/dark mode"
    >
      {isLight ? (
        <>
          <Moon size={13} />
          Switch to Dark
        </>
      ) : (
        <>
          <Sun size={13} />
          Switch to Light
        </>
      )}
    </button>
  )
}
