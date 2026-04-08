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

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = Number(formData.get('price'))
  const category_id = formData.get('category_id') as string
  const file = formData.get('image') as File | null

  if (!name || isNaN(price) || price < 0) {
    return { error: 'Invalid name or price.' }
  }

  // 1. Create the product
  const { data: product, error: insertError } = await supabase
    .from('products')
    .insert({
      shopper_id: user.id,
      name,
      description,
      price,
      category_id: category_id || null, // Allow null if "other" is selected
      is_available: true,
      stock: 1, // Defaulting to 1 for now, can be expanded
    })
    .select()
    .single()

  if (insertError) return { error: insertError.message }

  // 2. Upload image if provided
  if (file && file.size > 0 && product) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${product.id}/${crypto.randomUUID()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, file)

    if (!uploadError) {
      const { data: publicUrl } = supabase.storage
        .from('products')
        .getPublicUrl(fileName)

      await supabase.from('product_images').insert({
        product_id: product.id,
        url: publicUrl.publicUrl,
        is_primary: true,
      })
    }
  }

  revalidatePath('/dashboard/listings')
  revalidatePath('/products')
  redirect('/dashboard/listings')
}

export async function toggleProductAvailability(
    productId: string, 
    isAvailable: boolean
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error("Unauthorized")
    
    const { error } = await supabase
      .from('products')
      .update({ is_available: !isAvailable })
      .eq('id', productId)
      .eq('shopper_id', user.id) // Ensure owner
      
    if (error) throw new Error(error.message)
    
    revalidatePath('/dashboard/listings')
}

export async function deleteProduct(productId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error("Unauthorized")
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('shopper_id', user.id) // Ensure owner
      
    if (error) throw new Error(error.message)
    
    revalidatePath('/dashboard/listings')
    revalidatePath('/products')
}
