import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { customerBot } from "./lib/telegram/customer/bot";
import "./lib/telegram/customer/commands"; // We will create this in the next steps

console.log("🛒 Starting KelalShop Customer Bot in Long Polling mode...");
console.log("✅ Customer Bot is running! Press Ctrl+C to stop.");

customerBot.start({
    onStart: (botInfo) => {
        console.log(`\n🚀 Customer Bot @${botInfo.username} is now active!\nSend /start in Telegram to test it.\n`);
    },
});
