'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useTransition,
  type ReactNode,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toggleWishlist } from '@/lib/actions/wishlist'

interface WishlistContextValue {
  wishlistItems: string[]
  toggleWishlistItem: (productId: string) => Promise<void>
  wishlistCount: number
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider')
  return ctx
}

interface WishlistProviderProps {
  children: ReactNode
  initialItems?: string[]
}

export function WishlistProvider({ children, initialItems = [] }: WishlistProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [wishlistItems, setWishlistItems] = useState<string[]>(initialItems)
  const [, startTransition] = useTransition()

  const toggleWishlistItem = useCallback(async (productId: string) => {
    // Optimistic update
    setWishlistItems((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      } else {
        return [...prev, productId]
      }
    })

    // Perform server action in background without blocking
    startTransition(async () => {
      try {
        const result = await toggleWishlist(productId)
        if (result?.error === 'not_authenticated') {
          // Revert on error
          setWishlistItems((prev) => {
            if (prev.includes(productId)) {
              return prev.filter((id) => id !== productId)
            } else {
              return [...prev, productId]
            }
          })
          router.push(`/auth/login?redirectTo=${encodeURIComponent(pathname)}`)
        }
      } catch (error) {
        // Revert on error could be implemented here if needed
        console.error("Failed to toggle wishlist", error)
      }
    })
  }, [router, pathname])

  const wishlistCount = wishlistItems.length

  return (
    <WishlistContext.Provider value={{ wishlistItems, toggleWishlistItem, wishlistCount }}>
      {children}
    </WishlistContext.Provider>
  )
}
