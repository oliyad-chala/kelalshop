import { customerBot } from "./bot";

import "./flows/auth.flow";
import "./flows/orders.flow";
import "./flows/search.flow";
import "./flows/deals.flow";
import "./flows/support.flow";


customerBot.command("start", async (ctx) => {
    await ctx.reply(
        "👋 Welcome to KelalShop Customer Bot! 🛍️\n\n" +
        "I am here to help you find products, check your orders, and more.\n" +
        "Use /help to see what I can do!"
    );
});

customerBot.command("help", async (ctx) => {
    let helpText = "🛍️ **Commands**\n" +
        "/orders - View your recent orders\n" +
        "/track - Track an order by status\n" +
        "/deals - Active flash sales\n" +
        "/search - Find products\n" +
        "/support - Get help or open a ticket\n" +
        "/profile - View your profile\n\n" +
        "You can also ask me questions directly, for example:\n" +
        "_\"Do you have any running shoes under 2000 ETB?\"_";

    await ctx.reply(helpText, { parse_mode: "Markdown" });
});

customerBot.on("message:text", async (ctx) => {
    // Basic text echo for now until Gemini integration
    await ctx.reply("I received your message, but AI features are coming soon!");
});
