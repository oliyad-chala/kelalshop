import { customerBot } from "./bot";

import "./flows/auth.flow";
import "./flows/orders.flow";
import "./flows/support.flow";
import "./flows/deals.flow";
import "./flows/search.flow";


import { Keyboard } from "grammy";

const mainMenu = new Keyboard()
    .text("🔍 Search Products").text("⚡ Flash Deals").row()
    .text("📦 My Orders").text("💬 Support Ticket").row()
    .text("⚙️ Profile / Link Account")
    .resized()
    .persistent();

customerBot.command("start", async (ctx) => {
    const welcomeMsg = `👋 *Welcome to KelalShop Customer Bot\\!* 🛍️\n\n` +
        `I am your personal AI shopping assistant\\. I can help you find products, track orders, and answer your questions\\.\n\n` +
        `👇 *Use the menu below to get started, or just type what you are looking for\\!*`;
        
    await ctx.reply(welcomeMsg, { parse_mode: "MarkdownV2", reply_markup: mainMenu });
});

customerBot.command("help", async (ctx) => {
    const helpText = `🛍️ *KelalShop Help Menu*\n\n` +
        `You can use the bottom menu, or type commands directly:\n` +
        `• /orders \\- View your recent orders\n` +
        `• /track \\- Track an active order\n` +
        `• /deals \\- View active flash sales\n` +
        `• /search \\- Find products\n` +
        `• /support \\- Open a support ticket\n` +
        `• /link \\- Link your KelalShop account\n\n` +
        `🤖 *AI Assistant*\n` +
        `You can also just talk to me naturally\\! For example:\n` +
        `_"Do you have any gaming laptops under 80000 ETB?"_`;

    await ctx.reply(helpText, { parse_mode: "MarkdownV2", reply_markup: mainMenu });
});

// We need to map keyboard text clicks to commands
customerBot.hears("🔍 Search Products", async (ctx) => {
    await ctx.reply("🔍 *What are you looking for?*\n\nJust type what you want to buy, for example: _'Running shoes'_", { parse_mode: "MarkdownV2" });
});
customerBot.hears("⚡ Flash Deals", async (ctx) => ctx.reply("⚡ Checking active deals...").then(() => ctx.api.sendMessage(ctx.chat.id, "Please use /deals for now!")));
customerBot.hears("📦 My Orders", async (ctx) => {
    await ctx.reply("📦 Fetching your orders...");
    // Trigger the orders flow by forwarding as if /orders was typed
    await ctx.api.sendMessage(ctx.chat.id, "Please use /orders command!");
});
customerBot.hears("💬 Support Ticket", async (ctx) => {
    await ctx.reply(
        "🎫 **Customer Support**\n\nPlease describe your issue in a single message below, and our team will get back to you.",
        { 
            parse_mode: "Markdown",
            reply_markup: { force_reply: true, selective: true }
        }
    );
});
customerBot.hears("⚙️ Profile / Link Account", async (ctx) => {
    await ctx.reply(
        "🔗 **Account Linking**\n\nPlease enter the email address associated with your KelalShop account:", 
        { 
            parse_mode: "Markdown",
            reply_markup: { force_reply: true, selective: true }
        }
    );
});


customerBot.on("message:text", async (ctx) => {
    // Fallback - this should rarely be reached now
    await ctx.reply("I didn't understand that. Try using /search to find products, or /support for help.");
});
