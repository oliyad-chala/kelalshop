/**
 * register-customer-webhook.ts
 * 
 * Registers the customer bot webhook with Telegram.
 * Run with: npx tsx --env-file=.env.local scripts/register-customer-webhook.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const CUSTOMER_TOKEN = process.env.TELEGRAM_CUSTOMER_BOT_TOKEN!;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kelalshop.com";

// Remove trailing slash
const domain = SITE_URL.replace(/\/$/, "");
const webhookUrl = `${domain}/api/telegram/customer-webhook`;

async function registerWebhook() {
    console.log(`\n📡 Registering Customer Bot webhook...`);
    console.log(`   URL: ${webhookUrl}\n`);

    // First, delete any existing webhook (clears long-poll mode too)
    const deleteRes = await fetch(
        `https://api.telegram.org/bot${CUSTOMER_TOKEN}/deleteWebhook`,
        { method: "POST" }
    );
    const deleteData = await deleteRes.json();
    console.log(`Delete old webhook: ${deleteData.ok ? "✅ OK" : "❌ " + deleteData.description}`);

    // Set new webhook
    const setRes = await fetch(
        `https://api.telegram.org/bot${CUSTOMER_TOKEN}/setWebhook`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: webhookUrl,
                secret_token: WEBHOOK_SECRET,
                allowed_updates: ["message", "callback_query", "inline_query"],
                drop_pending_updates: true,
            }),
        }
    );
    const setData = await setRes.json();
    console.log(`Set webhook:        ${setData.ok ? "✅ OK" : "❌ " + setData.description}`);

    if (!setData.ok) {
        process.exit(1);
    }

    // Verify
    const infoRes = await fetch(
        `https://api.telegram.org/bot${CUSTOMER_TOKEN}/getWebhookInfo`
    );
    const infoData = await infoRes.json();
    const info = infoData.result;

    console.log(`\n✅ Customer Bot webhook is now active!`);
    console.log(`   Webhook URL:    ${info.url}`);
    console.log(`   Pending updates: ${info.pending_update_count}`);
    if (info.last_error_message) {
        console.log(`   Last error:      ${info.last_error_message}`);
    }
}

registerWebhook().catch(console.error);
