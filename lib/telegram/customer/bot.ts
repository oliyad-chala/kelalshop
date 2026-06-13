import { Bot, Context } from "grammy";

// Add specific properties to our context type
export type CustomerContext = Context & {
    user?: any; // The telegram_users record if linked
};

if (!process.env.TELEGRAM_CUSTOMER_BOT_TOKEN) {
    throw new Error("TELEGRAM_CUSTOMER_BOT_TOKEN is not defined in environment variables");
}

export const customerBot = new Bot<CustomerContext>(process.env.TELEGRAM_CUSTOMER_BOT_TOKEN);
