'use server'

import { createClient } from '@/lib/supabase/server'
import { isAdminRole } from '@/lib/utils/admin-roles'

export async function getPlatformSettings() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
    console.error('Error fetching platform settings:', error)
  }

  return {
    maintenanceMode: data?.maintenance_mode ?? false
  }
}

export async function updatePlatformSettings(maintenanceMode: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) {
    throw new Error('Forbidden')
  }

  // Get the first setting row
  const { data: existing } = await supabase
    .from('platform_settings')
    .select('id')
    .limit(1)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('platform_settings')
      .update({ maintenance_mode: maintenanceMode })
      .eq('id', existing.id)

    if (error) throw new Error(error.message)
  } else {
    // If no row exists, we should let it fail or ideally have the DB seeded.
    // Assuming migration inserted the default row.
    throw new Error('Platform settings row not found. Please run migrations.')
  }

  return { success: true }
}
