'use server'

import { createClient } from '@/lib/supabase/server'

export async function subscribeToNewsletter(email: string) {
  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email: email.trim().toLowerCase() })

  if (error) {
    if (error.message.includes('duplicate') || error.code === '23505') {
      return { success: true, message: 'You are already subscribed!' }
    }
    console.error('Newsletter subscription failed:', error)
    return { error: 'Failed to subscribe. Please try again later.' }
  }

  return { success: true, message: 'Thank you for subscribing!' }
}
