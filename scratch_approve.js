const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const env = fs.readFileSync('.env.local', 'utf-8').split('\n')
const getEnv = (key) => env.find(l => l.startsWith(key))?.split('=')[1]?.trim()

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('Approving all existing products...')
  const { data, error } = await supabase
    .from('products')
    .update({ approval_status: 'approved' })
    .neq('approval_status', 'approved')

  if (error) {
    console.error('Error updating products:', error)
  } else {
    console.log('Successfully approved products.')
  }
}

run()
