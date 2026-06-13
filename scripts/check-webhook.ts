import { config } from "dotenv";
config({ path: ".env.local" });

const adminToken = process.env.TELEGRAM_BOT_TOKEN;
const customerToken = process.env.TELEGRAM_CUSTOMER_BOT_TOKEN;

async function checkWebhook(token: string, name: string) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const data = await res.json();
    console.log(`--- ${name} ---`);
    console.log(data.result);
  } catch (e) {
    console.error(`Error checking ${name}:`, e);
  }
}

async function main() {
  await checkWebhook(adminToken!, "Admin Bot");
  await checkWebhook(customerToken!, "Customer Bot");
}

main();
