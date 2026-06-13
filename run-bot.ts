import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { bot } from "./lib/telegram/admin/bot";
import "./lib/telegram/admin/commands";

console.log("🤖 Starting KelalShop Bot in Long Polling mode...");
console.log("✅ Bot is running! Press Ctrl+C to stop.");

bot.start({
    onStart: (botInfo) => {
        console.log(`\n🚀 Bot @${botInfo.username} is now active!\nSend /start in Telegram to test it.\n`);
    },
});
