import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CartProvider } from '@/lib/context/CartContext'
import { WishlistProvider } from '@/lib/context/WishlistContext'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { LayoutWrapper } from '@/components/layout/LayoutWrapper'
import { SupportWidget } from '@/components/chat/SupportWidget'
import type { Profile } from '@/types/app.types'
import type { CartItem } from '@/lib/context/CartContext'
import { resolveProductPrices } from '@/lib/utils/campaign-pricing'
import '../globals.css'

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let initialCartItems: CartItem[] = []
  let initialWishlistItems: string[] = []

  if (user) {
    const [profileResult, cartResult, wishlistResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          products(
            id, name, price, stock, is_available,
            product_images(url, is_primary),
            profiles:shopper_id(id, full_name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', user.id)
    ])

    profile = profileResult.data as Profile | null

    // Prevent admin/staff from accessing the public storefront or shopper dashboard
    if (profile?.role === 'admin' || profile?.role === 'staff') {
      redirect('/admin/dashboard')
    }

    const cartRows = (cartResult.data ?? []) as any[]
    const productRows = cartRows
      .map((row) => row.products)
      .filter(Boolean)
      .map((p: any) => ({ id: p.id as string, price: Number(p.price) }))

    const effectivePrices =
      productRows.length > 0
        ? await resolveProductPrices(supabase, productRows)
        : new Map<string, number>()

    initialCartItems = cartRows.map((row) => {
      const p = row.products
      const images: any[] = p?.product_images ?? []
      const primary = images.find((i: any) => i.is_primary)?.url ?? images[0]?.url ?? null
      const basePrice = Number(p?.price ?? 0)
      const effectivePrice = p?.id ? (effectivePrices.get(p.id) ?? basePrice) : basePrice
      return {
        id: row.id,
        quantity: row.quantity,
        product: {
          id: p?.id ?? '',
          name: p?.name ?? '',
          price: effectivePrice,
          stock: p?.stock ?? 0,
          is_available: p?.is_available ?? false,
          image: primary,
          shopperName: p?.profiles?.full_name ?? '',
          shopperId: p?.profiles?.id ?? '',
        },
      }
    })

    initialWishlistItems = (wishlistResult.data ?? []).map((row) => row.product_id)
  }

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 antialiased selection:bg-amber-200 selection:text-amber-900">
      <WishlistProvider initialItems={initialWishlistItems}>
        <CartProvider initialItems={initialCartItems}>
          <LayoutWrapper profile={profile}>
            {children}
          </LayoutWrapper>
          <CartDrawer />
          <SupportWidget />
        </CartProvider>
      </WishlistProvider>
    </div>
  )
}
