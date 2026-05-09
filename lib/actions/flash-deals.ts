'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const MAX_ACTIVE_DEALS = 3

export async function createFlashDeal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify shopper & verified status
  const { data: sp } = await supabase
    .from('shopper_profiles')
    .select('verification_status')
    .eq('id', user.id)
    .single()

  if (sp?.verification_status !== 'verified') {
    throw new Error('Only verified shoppers can create flash deals.')
  }

  // Check active deal count (max 3)
  const { count } = await supabase
    .from('flash_deals')
    .select('*', { count: 'exact', head: true })
    .eq('shopper_id', user.id)
    .eq('is_active', true)
    .gt('ends_at', new Date().toISOString())

  if ((count ?? 0) >= MAX_ACTIVE_DEALS) {
    throw new Error(`You can have at most ${MAX_ACTIVE_DEALS} active flash deals at a time.`)
  }

  const product_id = formData.get('product_id') as string
  const discount_percent = Number(formData.get('discount_percent'))
  const ends_at = formData.get('ends_at') as string

  if (!product_id) throw new Error('Please select a product.')
  if (isNaN(discount_percent) || discount_percent < 5 || discount_percent > 90)
    throw new Error('Discount must be between 5% and 90%.')
  if (!ends_at) throw new Error('Please set an end date.')
  if (new Date(ends_at) <= new Date()) throw new Error('End date must be in the future.')

  // Confirm product belongs to this shopper
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', product_id)
    .eq('shopper_id', user.id)
    .eq('is_available', true)
    .single()

  if (!product) throw new Error('Product not found or not available.')

  const { error } = await supabase.from('flash_deals').insert({
    product_id,
    shopper_id: user.id,
    discount_percent,
    ends_at,
    is_active: true,
  } as any)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/flash-deals')
  revalidatePath('/')
}

export async function deleteFlashDeal(dealId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('flash_deals')
    .delete()
    .eq('id', dealId)
    .eq('shopper_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/flash-deals')
  revalidatePath('/')
}

export async function toggleFlashDeal(dealId: string, currentlyActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // If activating, re-check the cap
  if (!currentlyActive) {
    const { count } = await supabase
      .from('flash_deals')
      .select('*', { count: 'exact', head: true })
      .eq('shopper_id', user.id)
      .eq('is_active', true)
      .gt('ends_at', new Date().toISOString())

    if ((count ?? 0) >= MAX_ACTIVE_DEALS) {
      throw new Error(`You can have at most ${MAX_ACTIVE_DEALS} active flash deals.`)
    }
  }

  const { error } = await supabase
    .from('flash_deals')
    .update({ is_active: !currentlyActive } as any)
    .eq('id', dealId)
    .eq('shopper_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/flash-deals')
  revalidatePath('/')
}
