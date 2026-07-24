import { spawn } from 'child_process'

console.log('🚀 Booting Telegram Bots Supervisor...')

function runBot(scriptPath: string, name: string) {
  const botProcess = spawn('npx', ['tsx', scriptPath], {
    stdio: 'inherit',
    shell: true,
  })

  botProcess.on('close', (code) => {
    console.log(`[Supervisor] ${name} exited with code ${code}. Restarting...`)
    setTimeout(() => runBot(scriptPath, name), 5000)
  })

  botProcess.on('error', (err) => {
    console.error(`[Supervisor] ${name} error:`, err)
  })
}

runBot('run-bot.ts', 'Admin Bot')
runBot('run-customer-bot.ts', 'Customer Bot')
