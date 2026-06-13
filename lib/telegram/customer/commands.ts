import { customerBot } from "./bot";

import "./flows/auth.flow";
import "./flows/orders.flow";
import "./flows/search.flow";
import "./flows/deals.flow";
import "./flows/support.flow";


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
    ctx.session.state = "IDLE";
});
customerBot.hears("⚡ Flash Deals", async (ctx) => ctx.api.sendMessage(ctx.chat.id, "Checking deals... Please use /deals for now (will be mapped soon)"));
customerBot.hears("📦 My Orders", async (ctx) => ctx.api.sendMessage(ctx.chat.id, "Fetching orders... Please use /orders for now"));
customerBot.hears("💬 Support Ticket", async (ctx) => ctx.api.sendMessage(ctx.chat.id, "Opening support... Please use /support for now"));
customerBot.hears("⚙️ Profile / Link Account", async (ctx) => ctx.api.sendMessage(ctx.chat.id, "Please use /link to link your account."));


customerBot.on("message:text", async (ctx) => {
    // Basic text echo for now until Gemini integration
    await ctx.reply("I received your message, but AI features are coming soon!");
});
