import { config } from "dotenv";
config({ path: ".env.local" });

const args = process.argv.slice(2);
const domain = args[0];

if (!domain) {
  console.error("Please provide your Vercel deployment domain as an argument.");
  console.error("Example: npm run set-webhooks https://your-project.vercel.app");
  process.exit(1);
}

const adminToken = process.env.TELEGRAM_BOT_TOKEN;
const customerToken = process.env.TELEGRAM_CUSTOMER_BOT_TOKEN;
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!adminToken || !customerToken || !webhookSecret) {
  console.error("Missing required environment variables in .env.local.");
  process.exit(1);
}

async function setWebhook(token: string, botName: string, endpoint: string) {
  const webhookUrl = `${domain}${endpoint}`;
  const apiUrl = `https://api.telegram.org/bot${token}/setWebhook`;
  
  console.log(`Setting webhook for ${botName}...`);
  
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: webhookSecret,
      }),
    });
    
    const data = await response.json();
    if (data.ok) {
      console.log(`✅ Success: ${botName} webhook set to ${webhookUrl}`);
    } else {
      console.error(`❌ Error setting ${botName} webhook:`, data.description);
    }
  } catch (error) {
    console.error(`❌ Failed to set ${botName} webhook:`, error);
  }
}

async function main() {
  // Ensure domain doesn't end with slash
  const cleanDomain = domain.replace(/\/$/, "");
  
  await setWebhook(adminToken!, "Admin Bot", "/api/telegram/webhook");
  await setWebhook(customerToken!, "Customer Bot", "/api/telegram/customer-webhook");
}

main();
