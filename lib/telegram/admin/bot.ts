import { Bot } from "grammy";
import { BotContext } from "./types";

export type { BotContext };

if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not defined in environment variables");
}

export const bot = new Bot<BotContext>(process.env.TELEGRAM_BOT_TOKEN);
