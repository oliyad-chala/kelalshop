'use client'

import { useState } from 'react'
import { Phone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/lib/context/CartContext'
import type { CartItem } from '@/lib/context/CartContext'
import { ContactSellerModal } from '@/components/products/ContactSellerModal'

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
  const { addItem, openCart } = useCart()
  const [loadingCart, setLoadingCart] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)

  const handleAddToCart = async () => {
    setLoadingCart(true)
    await addItem(product)
    setLoadingCart(false)
    openCart()
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
          onClick={() => setIsContactOpen(true)}
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
