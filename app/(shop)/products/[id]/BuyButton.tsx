'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/lib/context/CartContext'
import type { CartItem } from '@/lib/context/CartContext'

interface BuyButtonProps {
  product: CartItem['product']
}

export function BuyButton({ product }: BuyButtonProps) {
  const router = useRouter()
  const { addItem, openCart } = useCart()
  const [loading, setLoading] = useState<'cart' | 'buy' | null>(null)

  const handleAddToCart = async () => {
    setLoading('cart')
    await addItem(product)
    setLoading(null)
    openCart()
  }

  const handleBuyNow = async () => {
    setLoading('buy')
    await addItem(product)
    router.push('/checkout')
  }

  const isSold = product.is_available === false

  return (
    <div className="flex gap-3">
      <Button 
        size="lg" 
        variant="outline" 
        className="flex-1 border-amber-500 text-amber-600 hover:bg-amber-50" 
        disabled={isSold || loading !== null}
        onClick={handleAddToCart}
        loading={loading === 'cart'}
      >
        {isSold ? 'Sold Out' : 'Add to Cart'}
      </Button>

      <Button 
        size="lg" 
        variant="primary" 
        className="flex-1 bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold" 
        disabled={isSold || loading !== null}
        onClick={handleBuyNow}
        loading={loading === 'buy'}
      >
        {isSold ? 'Sold Out' : 'Buy Now'}
      </Button>
    </div>
  )
}
