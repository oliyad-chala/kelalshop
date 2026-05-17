'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ActionState } from '@/types/app.types'

export async function createProduct(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // Guard: shopper must be verified
  const { data: shopperProfile } = await supabase
    .from('shopper_profiles')
    .select('verification_status, subscription_plan, subscription_expires_at')
    .eq('id', user.id)
    .single()

  if (shopperProfile?.verification_status !== 'verified') {
    return { error: 'You must be a verified shopper to create listings.' }
  }

  // Check subscription limit
  const plan = shopperProfile.subscription_plan || 'free'
  const isExpired = shopperProfile.subscription_expires_at && new Date(shopperProfile.subscription_expires_at) < new Date()
  const activePlan = isExpired ? 'free' : plan

  let forceInactive = false
  if (activePlan === 'free') {
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('shopper_id', user.id)
      .eq('is_available', true)
    
    if (countError) return { error: 'Failed to verify subscription limits.' }
    if (count && count >= 3) {
      forceInactive = true // Limit reached, new listings must be hidden
    }
  }

  const rawName     = formData.get('name') as string
  const customName  = formData.get('custom_name') as string | null
  const description = formData.get('description') as string
  const price       = Number(formData.get('price'))
  const stock       = Number(formData.get('stock') ?? 1)
  const category_id = formData.get('category_id') as string | null
  const location    = formData.get('location') as string | null

  // If "Other" category was selected, use custom_name as the product name
  const name = customName?.trim() || rawName

  if (!name || isNaN(price) || price < 0) {
    return { error: 'Please provide a valid name and price.' }
  }

  // Multi-image upload: field name is "images" (multiple)
  const imageFiles = formData.getAll('images') as File[]
  const validImages = imageFiles.filter(f => f && f.size > 0)

  if (validImages.length > 3) {
    return { error: 'You can upload a maximum of 3 photos.' }
  }

  const MAX_BYTES = 5 * 1024 * 1024
  const oversized = validImages.find(f => f.size > MAX_BYTES)
  if (oversized) {
    return { error: `"${oversized.name}" exceeds the 5 MB limit per image.` }
  }

  // Extract dynamic attributes
  const attributes: Record<string, string> = {}
  formData.forEach((value, key) => {
    if (key.startsWith('attr_') && value) {
      const cleanKey = key.replace('attr_', '')
      attributes[cleanKey] = value.toString().trim()
    }
  })

  // 1. Insert product
  const { data: productResult, error: insertError } = await supabase
    .from('products')
    .insert({
      shopper_id: user.id,
      name,
      description,
      price,
      stock,
      category_id: category_id || null,
      location: location?.trim() || null,
      attributes,
      is_available: !forceInactive, // Set to false if limit is reached
    } as any)
    .select()
    .single()

  const product = productResult as any

  if (insertError) return { error: insertError.message }

  // 2. Upload images
  for (let i = 0; i < validImages.length; i++) {
    const file = validImages[i]
    const fileExt = file.name.split('.').pop()
    const fileName = `${product.id}/${crypto.randomUUID()}.${fileExt}`
    const fileBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true
      })

    if (!uploadError) {
      const { data: publicUrl } = supabase.storage
        .from('products')
        .getPublicUrl(fileName)

      await supabase.from('product_images').insert({
        product_id: product.id,
        url: publicUrl.publicUrl,
        is_primary: i === 0, // first image is primary
        sort_order: i,
      } as any)
    }
  }

  revalidatePath('/dashboard/listings')
  revalidatePath('/dashboard/billing')
  revalidatePath('/')
  revalidatePath('/products')
  redirect('/dashboard/listings')
}

export async function toggleProductAvailability(productId: string, isAvailable: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // If trying to activate, check limits
  if (!isAvailable) { // isAvailable here means the *current* state is false, so they are trying to set it to true
    const { data: shopperProfile } = await supabase
      .from('shopper_profiles')
      .select('subscription_plan, subscription_expires_at')
      .eq('id', user.id)
      .single()

    const plan = shopperProfile?.subscription_plan || 'free'
    const isExpired = shopperProfile?.subscription_expires_at && new Date(shopperProfile.subscription_expires_at) < new Date()
    const activePlan = isExpired ? 'free' : plan

    if (activePlan === 'free') {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('shopper_id', user.id)
        .eq('is_available', true)

      if (count && count >= 3) {
        throw new Error('You have reached the free limit of 3 active products. Please hide another product first or upgrade to Pro.')
      }
    }
  }

  const { error } = await supabase
    .from('products')
    .update({ is_available: !isAvailable } as any)
    .eq('id', productId)
    .eq('shopper_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/listings')
  revalidatePath('/')
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('shopper_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/listings')
  revalidatePath('/dashboard/billing')
  revalidatePath('/')
}
