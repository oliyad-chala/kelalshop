import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type PromotionRow = Database['public']['Tables']['promotions']['Row']

/** Sync promotion status based on current date (no cron required). */
export async function syncCampaignStatuses(
  supabase: SupabaseClient<Database>
): Promise<void> {
  const now = new Date().toISOString()

  const { data: campaigns } = await supabase
    .from('promotions')
    .select('id, start_date, end_date, status, is_active')
    .neq('status', 'ended')

  if (!campaigns?.length) return

  for (const c of campaigns as PromotionRow[]) {
    let nextStatus = c.status
    let isActive = c.is_active

    if (now >= c.end_date) {
      nextStatus = 'ended'
      isActive = false
    } else if (now >= c.start_date && now < c.end_date) {
      nextStatus = 'active'
      isActive = true
    } else if (now < c.start_date) {
      nextStatus = 'upcoming'
      isActive = true
    }

    if (nextStatus !== c.status || isActive !== c.is_active) {
      await supabase
        .from('promotions')
        .update({ status: nextStatus, is_active: isActive, updated_at: now } as any)
        .eq('id', c.id)
    }
  }
}
