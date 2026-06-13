/**
 * commands.ts — Customer Bot Entry Point
 *
 * This file is the SINGLE place where all handlers are registered on the bot.
 * Registration order is critical for grammy's middleware chain:
 *
 *   1. /start, /help  (commands — always match first)
 *   2. Auth flow      (/link + force-reply message:text interceptor)
 *   3. Support flow   (/support + force-reply message:text interceptor)
 *   4. Orders flow    (/orders, /track, cancel callbacks)
 *   5. Deals flow     (/deals)
 *   6. Button hears() — must come BEFORE the search catch-all
 *   7. Search flow    (/search + catch-all message:text for product search)
 *   8. Fallback       — unhandled text
 *
 * All flow files use the registerXxxFlow(bot) pattern so that handler
 * registration happens here, in a deterministic order, without relying on
 * ES module import hoisting side-effects.
 */

import { customerBot } from "./bot";
import { Keyboard } from "grammy";

// ─── Flow modules (no side-effects on import — they export register fns) ───
import { handleLinkPrompt,    registerAuthFlow    } from "./flows/auth.flow";
import { handleSupportPrompt, registerSupportFlow } from "./flows/support.flow";
import { handleOrders,        registerOrdersFlow  } from "./flows/orders.flow";
import { handleDeals,         registerDealsFlow   } from "./flows/deals.flow";
import {                      registerSearchFlow  } from "./flows/search.flow";

// ─── Main Menu Keyboard ──────────────────────────────────────────────────────
export const mainMenu = new Keyboard()
    .text("🔍 Search Products").text("⚡ Flash Deals").row()
    .text("📦 My Orders").text("💬 Support Ticket").row()
    .text("⚙️ Profile / Link Account")
    .resized()
    .persistent();

// ══════════════════════════════════════════════════════════════════════════════
// 1. Basic commands
// ══════════════════════════════════════════════════════════════════════════════

customerBot.command("start", async (ctx) => {
    const msg =
        `👋 *Welcome to KelalShop Customer Bot\\!* 🛍️\n\n` +
        `I'm your personal shopping assistant\\. Find products, track orders, and get support\\.\n\n` +
        `👇 *Use the menu below to get started\\!*`;
    await ctx.reply(msg, { parse_mode: "MarkdownV2", reply_markup: mainMenu });
});

customerBot.command("help", async (ctx) => {
    const msg =
        `🛍️ *KelalShop Help Menu*\n\n` +
        `Use the bottom menu, or type commands directly:\n` +
        `• /orders \\- View your recent orders\n` +
        `• /track \\- Track an active order\n` +
        `• /deals \\- View active flash sales\n` +
        `• /search \\- Find products\n` +
        `• /support \\- Open a support ticket\n` +
        `• /link \\- Link your KelalShop account\n\n` +
        `🤖 *AI Assistant*\n` +
        `You can also talk to me naturally\\! e\\.g\\.:\n` +
        `_"Do you have gaming laptops under 80000 ETB?"_`;
    await ctx.reply(msg, { parse_mode: "MarkdownV2", reply_markup: mainMenu });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Auth flow  (registers /link + force-reply message:text interceptor)
// ══════════════════════════════════════════════════════════════════════════════
registerAuthFlow(customerBot);

// ══════════════════════════════════════════════════════════════════════════════
// 3. Support flow  (registers /support + force-reply message:text interceptor)
// ══════════════════════════════════════════════════════════════════════════════
registerSupportFlow(customerBot);

// ══════════════════════════════════════════════════════════════════════════════
// 4. Orders flow  (registers /orders, /track, callbacks)
// ══════════════════════════════════════════════════════════════════════════════
registerOrdersFlow(customerBot);

// ══════════════════════════════════════════════════════════════════════════════
// 5. Deals flow  (registers /deals)
// ══════════════════════════════════════════════════════════════════════════════
registerDealsFlow(customerBot);

// ══════════════════════════════════════════════════════════════════════════════
// 6. Bottom-menu button handlers  (hears BEFORE the search catch-all)
// ══════════════════════════════════════════════════════════════════════════════
customerBot.hears("🔍 Search Products", async (ctx) => {
    await ctx.reply(
        "🔍 *What are you looking for?*\n\nType a product name or describe what you need\\.\n_Example: 'gaming laptop under 80000 ETB'_",
        { parse_mode: "MarkdownV2" }
    );
});

customerBot.hears("⚡ Flash Deals",             handleDeals);
customerBot.hears("📦 My Orders",               handleOrders);
customerBot.hears("💬 Support Ticket",          handleSupportPrompt);
customerBot.hears("⚙️ Profile / Link Account", handleLinkPrompt);

// ══════════════════════════════════════════════════════════════════════════════
// 7. Search flow  (catch-all product search — registered last among text handlers)
// ══════════════════════════════════════════════════════════════════════════════
registerSearchFlow(customerBot);

// ══════════════════════════════════════════════════════════════════════════════
// 8. Final fallback for unhandled text
// ══════════════════════════════════════════════════════════════════════════════
customerBot.on("message:text", async (ctx) => {
    await ctx.reply(
        "I didn't quite understand that\\. Try using /search to find products, or /support for help\\.",
        { parse_mode: "MarkdownV2", reply_markup: mainMenu }
    );
});
