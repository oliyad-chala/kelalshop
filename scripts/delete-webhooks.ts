import { config } from "dotenv";
config({ path: ".env.local" });

const adminToken = process.env.TELEGRAM_BOT_TOKEN;
const customerToken = process.env.TELEGRAM_CUSTOMER_BOT_TOKEN;

if (!adminToken || !customerToken) {
  console.error("Missing required environment variables in .env.local.");
  process.exit(1);
}

async function deleteWebhook(token: string, botName: string) {
  const apiUrl = `https://api.telegram.org/bot${token}/deleteWebhook`;
  console.log(`Deleting webhook for ${botName}...`);
  
  try {
    const response = await fetch(apiUrl, { method: "POST" });
    const data = await response.json();
    if (data.ok) {
      console.log(`✅ Success: ${botName} webhook deleted. Polling is now active.`);
    } else {
      console.error(`❌ Error deleting ${botName} webhook:`, data.description);
    }
  } catch (error) {
    console.error(`❌ Failed to delete ${botName} webhook:`, error);
  }
}

async function main() {
  await deleteWebhook(adminToken!, "Admin Bot");
  await deleteWebhook(customerToken!, "Customer Bot");
}

main();
