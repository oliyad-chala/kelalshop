'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ActionState } from '@/types/app.types'

export async function createRequest(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const budget = formData.get('budget') ? Number(formData.get('budget')) : null
  const source_url = formData.get('source_url') as string
  const category_id = formData.get('category_id') as string
  const shopper_id = formData.get('shopper_id') as string // NEW

  if (!title || !description) {
    return { error: 'Title and description are required.' }
  }

  const { error } = await supabase
    .from('requests')
    .insert({
      buyer_id: user.id,
      shopper_id: shopper_id || null, // NEW
      title,
      description,
      budget,
      source_url: source_url || null,
      category_id: category_id || null,
      status: 'open',
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/requests')
  revalidatePath('/requests')
  redirect('/dashboard/requests')
}
