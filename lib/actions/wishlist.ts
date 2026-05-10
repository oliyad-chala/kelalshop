'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function toggleWishlist(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if it exists
  const { data: existing } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single()

  if (existing) {
    // Remove it
    await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId)
  } else {
    // Add it
    await supabase
      .from('wishlists')
      .insert({
        user_id: user.id,
        product_id: productId,
      })
  }

  revalidatePath('/products')
  revalidatePath(`/products/${productId}`)
  revalidatePath('/favorites')
}
