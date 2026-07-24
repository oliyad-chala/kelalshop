import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { processNotificationQueue } from './lib/telegram/notifications/queue-processor'

async function run() {
  console.log('Running processNotificationQueue manually...')
  try {
    const res = await processNotificationQueue(10)
    console.log('Result:', res)
  } catch (err) {
    console.error('Error running queue processor:', err)
  }
}

run()
