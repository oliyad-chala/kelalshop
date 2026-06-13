import { Bot, Context } from "grammy";

export interface BotContext extends Context {
    isAdmin: boolean;
    adminRole?: 'admin' | 'staff';
}

if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not defined in environment variables");
}

export const bot = new Bot<BotContext>(process.env.TELEGRAM_BOT_TOKEN);
