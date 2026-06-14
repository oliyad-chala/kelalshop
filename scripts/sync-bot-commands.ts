import { config } from 'dotenv'
config({ path: '.env.local' })

const adminToken = process.env.TELEGRAM_BOT_TOKEN
const customerToken = process.env.TELEGRAM_CUSTOMER_BOT_TOKEN

const adminCommands = [
  { command: 'dashboard', description: 'Live stats snapshot' },
  { command: 'orders', description: "Today's orders" },
  { command: 'products', description: 'Product count' },
  { command: 'pending', description: 'Pending product approvals' },
  { command: 'sellers', description: 'Pending seller applications' },
  { command: 'users', description: 'User statistics' },
  { command: 'tickets', description: 'Open support tickets' },
  { command: 'search', description: 'Search products and orders' },
  { command: 'help', description: 'Show all commands' },
]

const adminOnlyCommands = [
  { command: 'revenue', description: 'Revenue summary' },
  { command: 'analytics', description: 'Full analytics report' },
  { command: 'withdrawals', description: 'Pending payment requests' },
  { command: 'staff', description: 'Staff directory' },
  { command: 'security', description: 'Security alerts' },
  { command: 'broadcast', description: 'Broadcast to customers' },
]

const customerCommands = [
  { command: 'start', description: 'Welcome message' },
  { command: 'orders', description: 'Your recent orders' },
  { command: 'track', description: 'Track active orders' },
  { command: 'deals', description: 'Flash sales' },
  { command: 'search', description: 'Search products' },
  { command: 'support', description: 'Open support ticket' },
  { command: 'link', description: 'Link KelalShop account' },
  { command: 'help', description: 'Help menu' },
]

async function setCommands(token: string, name: string, commands: { command: string; description: string }[]) {
  const res = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands }),
  })
  const data = await res.json()
  if (data.ok) {
    console.log(`✅ ${name}: ${commands.length} commands synced`)
  } else {
    console.error(`❌ ${name}:`, data.description)
  }
}

async function main() {
  if (!adminToken || !customerToken) {
    console.error('Missing bot tokens in .env.local')
    process.exit(1)
  }
  await setCommands(adminToken, 'Admin Bot', [...adminCommands, ...adminOnlyCommands])
  await setCommands(customerToken, 'Customer Bot', customerCommands)
}

main()
