import { Bot } from "grammy";
import { BotContext } from "./types";
import { authMiddleware } from "./middleware";

export type { BotContext };

if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not defined in environment variables");
}

export const bot = new Bot<BotContext>(process.env.TELEGRAM_BOT_TOKEN);

// Apply auth middleware immediately at bot creation time.
// This MUST be here (not in commands.ts) because ES module imports are hoisted,
// meaning flow files register their handlers BEFORE any code in commands.ts runs.
// Putting it here ensures the middleware is registered first.
bot.use(authMiddleware);
