'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Phone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/lib/context/CartContext'
import type { CartItem } from '@/lib/context/CartContext'
import { ContactSellerModal } from '@/components/products/ContactSellerModal'
import { createClient } from '@/lib/supabase/client'

interface BuyButtonProps {
  product: CartItem['product']
  seller?: {
    id?: string
    name?: string
    phone?: string | null
    avatarUrl?: string | null
    location?: string | null
    verificationStatus?: string | null
  }
  currentUserId?: string | null
}

export function BuyButton({ product, seller, currentUserId }: BuyButtonProps) {
  const router = useRouter()
  const { addItem, openCart } = useCart()
  const [loadingCart, setLoadingCart] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(currentUserId ?? null)

  useEffect(() => {
    // Keep auth state strictly in sync with client session
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Auto-open contact modal after user logs in or registers
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('contact') === 'open') {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setIsContactOpen(true)
          // Clean up ?contact=open without full page refresh
          const url = new URL(window.location.href)
          url.searchParams.delete('contact')
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''))
        }
      })
    }
  }, [])

  const handleAddToCart = async () => {
    setLoadingCart(true)
    await addItem(product)
    setLoadingCart(false)
    openCart()
  }

  const handleShowContact = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const activeId = user?.id || userId

      if (!activeId) {
        const returnUrl = `/products/${product.id}?contact=open`
        window.location.href = `/auth/signup?redirectTo=${encodeURIComponent(returnUrl)}`
        return
      }

      setIsContactOpen(true)
    } catch {
      if (!userId) {
        const returnUrl = `/products/${product.id}?contact=open`
        window.location.href = `/auth/signup?redirectTo=${encodeURIComponent(returnUrl)}`
        return
      }
      setIsContactOpen(true)
    }
  }

  const isSold = product.is_available === false

  return (
    <>
      <div className="flex gap-3">
        <Button 
          size="lg" 
          variant="outline" 
          className="flex-1 border-amber-500 text-amber-600 hover:bg-amber-50 font-semibold disabled:border-slate-200 disabled:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed" 
          disabled={isSold || loadingCart}
          onClick={handleAddToCart}
          loading={loadingCart}
        >
          {isSold ? 'Sold Out' : 'Add to Cart'}
        </Button>

        <Button 
          size="lg" 
          variant="primary" 
          className="flex-1 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold flex items-center justify-center gap-2 shadow-sm" 
          onClick={handleShowContact}
        >
          <Phone className="w-4 h-4" />
          <span>Show Contact</span>
        </Button>
      </div>

      <ContactSellerModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        seller={seller || {
          id: product.shopperId,
          name: product.shopperName,
          phone: null,
        }}
        product={{
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
        }}
        isSold={isSold}
        currentUserId={currentUserId}
      />
    </>
  )
}
