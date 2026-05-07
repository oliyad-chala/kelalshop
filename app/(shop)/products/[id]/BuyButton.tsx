'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrder } from '@/lib/actions/orders'
import { Button } from '@/components/ui/Button'

interface BuyButtonProps {
  productId: string
  isAvailable: boolean
  isLoggedIn: boolean
}

export function BuyButton({ productId, isAvailable, isLoggedIn }: BuyButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleBuy = async () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?redirectTo=/products/${productId}`)
      return
    }

    try {
      setLoading(true)
      await createOrder(productId)
      router.push('/dashboard/orders')
    } catch (err: any) {
      alert(err.message || 'Failed to create order')
      setLoading(false)
    }
  }

  return (
    <Button 
      size="lg" 
      variant="primary" 
      className="w-full" 
      disabled={!isAvailable || loading}
      onClick={handleBuy}
      loading={loading}
    >
      Buy Now
    </Button>
  )
}
