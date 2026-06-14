import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const chatIdArg = process.argv[2]
const usernameArg = process.argv[3] ?? 'Admin'

const chatId = chatIdArg
  ? parseInt(chatIdArg, 10)
  : process.env.ADMIN_CHAT_ID
    ? parseInt(process.env.ADMIN_CHAT_ID, 10)
    : null

if (!chatId || Number.isNaN(chatId)) {
  console.error('Usage: npm run make-admin -- <telegram_chat_id> [username]')
  console.error('Or set ADMIN_CHAT_ID in .env.local')
  process.exit(1)
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log(`Registering chat ID ${chatId} as approved admin...`)

  const { error } = await supabase
    .from('telegram_admins')
    .upsert(
      {
        telegram_chat_id: chatId,
        username: usernameArg,
        role: 'admin',
        is_approved: true,
      },
      { onConflict: 'telegram_chat_id' }
    )

  if (error) {
    console.error('❌ Failed:', error.message)
    process.exit(1)
  }

  console.log('✅ Success! Send /start to the Admin bot to verify access.')
}

main()
