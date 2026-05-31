'use server'

import { createClient } from '@/lib/supabase/server'

export async function trackProductView(productId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return // Only track authenticated users

    // Insert view silently, don't block or error out the main page load
    await supabase.from('user_product_views').insert({
      user_id: user.id,
      product_id: productId
    })
  } catch (err) {
    console.error('Failed to track product view:', err)
  }
}
