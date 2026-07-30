'use server'

import { createClient } from '@/lib/supabase/server'
import { isAdminRole } from '@/lib/utils/admin-roles'
import { logAdminAction } from '@/lib/actions/activity-log'
import { revalidatePath } from 'next/cache'

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
    maintenanceMode: data?.maintenance_mode ?? false,
    platformName: data?.platform_name ?? 'KelalShop',
    supportEmail: data?.support_email ?? 'support@kelalshop.com',
    autoVerify: data?.auto_verify_sellers ?? false
  }
}

export async function updatePlatformSettings(settings: {
  maintenanceMode: boolean
  platformName: string
  supportEmail: string
  autoVerify: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
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

  const updateData = {
    maintenance_mode: settings.maintenanceMode,
    platform_name: settings.platformName,
    support_email: settings.supportEmail,
    auto_verify_sellers: settings.autoVerify
  }

  if (existing) {
    const { error } = await supabase
      .from('platform_settings')
      .update(updateData)
      .eq('id', existing.id)

    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('platform_settings')
      .insert(updateData)

    if (error) throw new Error(error.message)
  }

  await logAdminAction({
    adminId: user.id,
    adminName: profile?.full_name ?? 'Admin',
    actionType: 'update_settings',
    entityType: 'settings',
    description: `Updated platform settings: Name=${settings.platformName}, Support=${settings.supportEmail}, Maintenance=${settings.maintenanceMode ? 'ON' : 'OFF'}, AutoVerify=${settings.autoVerify ? 'ON' : 'OFF'}`,
    newData: updateData,
  })

  revalidatePath('/admin/settings')
  return { success: true }
}

export async function updateAdminAccount(fullName: string, phone: string) {
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

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  await logAdminAction({
    adminId: user.id,
    adminName: fullName,
    actionType: 'update_settings',
    entityType: 'profile',
    description: `Updated admin profile information`,
    newData: { full_name: fullName, phone },
  })

  revalidatePath('/admin/settings')
  return { success: true }
}

export async function updateAdminSecurity(
  password?: string,
  sessionTimeout?: number,
  twoFactor?: boolean
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) {
    throw new Error('Forbidden')
  }

  if (password) {
    const { error: pwdError } = await supabase.auth.updateUser({ password })
    if (pwdError) throw new Error(pwdError.message)
  }

  const updateData: any = {}
  if (sessionTimeout !== undefined) updateData.session_timeout = sessionTimeout
  if (twoFactor !== undefined) updateData.two_factor = twoFactor

  if (Object.keys(updateData).length > 0) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (profileError) throw new Error(profileError.message)
  }

  await logAdminAction({
    adminId: user.id,
    adminName: profile?.full_name ?? 'Admin',
    actionType: 'update_settings',
    entityType: 'profile',
    description: `Updated admin security/session settings`,
    newData: { has_password_change: !!password, sessionTimeout, twoFactor },
  })

  revalidatePath('/admin/settings')
  return { success: true }
}

export async function updateAdminNotifications(settings: {
  notifVerifications: boolean
  notifPayments: boolean
  notifDisputes: boolean
  notifNewSellers: boolean
  emailDigest: boolean
  digestEmailAddress: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) {
    throw new Error('Forbidden')
  }

  const updateData = {
    notif_verifications: settings.notifVerifications,
    notif_payments: settings.notifPayments,
    notif_disputes: settings.notifDisputes,
    notif_new_sellers: settings.notifNewSellers,
    email_digest: settings.emailDigest,
    digest_email_address: settings.digestEmailAddress.trim() || null,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  await logAdminAction({
    adminId: user.id,
    adminName: profile?.full_name ?? 'Admin',
    actionType: 'update_settings',
    entityType: 'profile',
    description: `Updated admin notification preferences`,
    newData: updateData,
  })

  revalidatePath('/admin/settings')
  return { success: true }
}
