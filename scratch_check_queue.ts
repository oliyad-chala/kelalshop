import { getTelegramSupabase } from './lib/telegram/core/supabase-admin'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function run() {
  const supabase = getTelegramSupabase()
  const { data, error } = await supabase
    .from('telegram_notification_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching queue:', error)
    return
  }

  console.log('--- Last 10 Queue Entries ---')
  console.log(JSON.stringify(data, null, 2))
}

run()
