'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addToCart(productId: string, quantity = 1) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'not_authenticated' }

  // Upsert: if already in cart, add qty
  const { error } = await supabase.rpc('upsert_cart_item', {
    p_user_id: user.id,
    p_product_id: productId,
    p_quantity: quantity,
  }).maybeSingle()

  // Fallback if RPC doesn't exist: manual upsert
  if (error) {
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single()

    if (existing) {
      await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity } as any)
        .eq('id', existing.id)
    } else {
      await supabase.from('cart_items').insert({
        user_id: user.id,
        product_id: productId,
        quantity,
      } as any)
    }
  }

  revalidatePath('/')
  return { success: true }
}

export async function updateCartQty(cartItemId: string, quantity: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  if (quantity <= 0) {
    await supabase.from('cart_items').delete().eq('id', cartItemId).eq('user_id', user.id)
  } else {
    await supabase.from('cart_items').update({ quantity } as any).eq('id', cartItemId).eq('user_id', user.id)
  }
}

export async function removeFromCart(cartItemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('cart_items').delete().eq('id', cartItemId).eq('user_id', user.id)
}

export async function clearCart() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('cart_items').delete().eq('user_id', user.id)
}

export async function getCartItems() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
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
    .order('created_at', { ascending: false })

  return data ?? []
}
