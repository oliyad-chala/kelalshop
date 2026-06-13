import { bot } from "./bot";
import { authMiddleware } from "./middleware";
import { handleGeminiQuery } from "../../gemini/assistant";

bot.use(authMiddleware);

import "./flows/dashboard";
import "./flows/products";
import "./flows/sellers";
import "./flows/orders";
import "./flows/withdrawals";
import "./flows/staff";
import "./flows/security";
import "./flows/broadcast";

bot.command("start", async (ctx) => {
    if (ctx.isAdmin) {
        await ctx.reply(
            `👋 Welcome back to the KelalShop Admin Bot!\n\n` +
            `You are authenticated as a **${ctx.adminRole === 'admin' ? "Super Admin" : "Staff"}**.\n` +
            `Use /help to see available commands or ask me a question to use the AI assistant.`,
            { parse_mode: "Markdown" }
        );
    } else {
        await ctx.reply(
            "👋 Welcome to KelalShop! 🛍️\n\n" +
            "Please use the Customer Bot for customer features. Admin Bot is only for authorized personnel."
        );
    }
});

bot.command("help", async (ctx) => {
    let helpText = "";

    if (ctx.isAdmin) {
        helpText += "🔒 **Commands**\n" +
        "/dashboard - Live stats snapshot\n" +
        "/orders - Recent orders with status\n" +
        "/products - All products\n" +
        "/pending - Products pending approval\n" +
        "/sellers - Pending seller applications\n" +
        "/tickets - Open support tickets\n" +
        "/search - Search anything\n";
        
        if (ctx.adminRole === 'admin') {
            helpText += "\n👑 **Admin Only Commands**\n" +
            "/revenue - Today's & this week's revenue\n" +
            "/analytics - Weekly/monthly trends\n" +
            "/withdrawals - Pending withdrawal requests\n" +
            "/staff - Manage staff accounts\n" +
            "/security - Security alerts & login failures\n" +
            "/broadcast - Send message to users/sellers\n";
        }
        
        helpText += "\n🤖 **AI Assistant Queries**\n" +
        "_\"Which sellers have the most sales?\"_\n" +
        "_\"Show revenue summary for this week\"_";
        
        await ctx.reply(helpText, { parse_mode: "Markdown" });
    } else {
        await ctx.reply("⛔ Access Denied.");
    }
});

// Handle text messages via Gemini AI
bot.on("message:text", async (ctx) => {
    const query = ctx.message.text;
    if (query.startsWith("/")) return;

    if (!ctx.isAdmin) {
        return ctx.reply("⛔ Access Denied.");
    }

    try {
        await ctx.replyWithChatAction("typing");
        const response = await handleGeminiQuery(query, ctx.isAdmin);
        await ctx.reply(response, { parse_mode: "Markdown" });
    } catch (error) {
        console.error("Gemini Error:", error);
        await ctx.reply("🤖 Sorry, I encountered an error while processing your query.");
    }
});
