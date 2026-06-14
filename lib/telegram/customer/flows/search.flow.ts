/**
 * search.flow.ts
 *
 * Exports:
 *  - registerSearchFlow(bot)  — registers the /search command and the
 *                               catch-all product search message:text handler
 *
 * This flow must be registered LAST so it acts as a catch-all for free text
 * after all other flows (auth, support, button hears) have had a chance to
 * handle the message.
 */
import { InlineKeyboard, Bot } from "grammy";
import { CustomerContext } from "../bot";
import { supabase } from "../../admin/middleware";
import { extractShoppingIntent, answerCustomerFAQ } from "../../../gemini/shopping-assistant";

// These must match the Keyboard labels in commands.ts exactly
const BUTTON_TEXTS = new Set([
    "🔍 Search Products",
    "⚡ Flash Deals",
    "📦 My Orders",
    "💬 Support Ticket",
    "⚙️ Profile / Link Account",
]);

export function registerSearchFlow(bot: Bot<CustomerContext>) {
    bot.command("search", async (ctx) => {
        await ctx.reply("🔍 What are you looking for? (e.g., 'gaming laptop under 80000 ETB')");
    });

    bot.on("message:text", async (ctx, next) => {
        const text = ctx.message.text.trim();

        // Pass commands through (handled by other command() registrations)
        if (text.startsWith("/")) return next();

        // Pass button texts through (handled by hears() registered before this)
        if (BUTTON_TEXTS.has(text)) return next();

        // Pass force-reply responses through to auth/support handlers
        const replyToText = ctx.message.reply_to_message?.text;
        if (
            replyToText?.includes("enter the email address") ||
            replyToText?.includes("enter the 6") ||
            replyToText?.includes("6\\-digit code") ||
            replyToText?.includes("describe your issue in a single message")
        ) {
            return next();
        }

        // ── AI search / FAQ ──────────────────────────────────────────────────
        await ctx.replyWithChatAction("typing");

        if (
            text.toLowerCase().includes("how") ||
            text.toLowerCase().includes("where") ||
            text.toLowerCase().includes("what is") ||
            text.endsWith("?")
        ) {
            const answer = await answerCustomerFAQ(text);
            return ctx.reply(answer, { parse_mode: "Markdown" });
        }

        const intent = await extractShoppingIntent(text);

        let query = supabase
            .from("products")
            .select("id, name, price")
            .eq("is_available", true);

        if (intent.keywords && intent.keywords.length > 0) {
            const likeSearch = `%${intent.keywords.join("%")}%`;
            query = query.ilike("name", likeSearch);
        }
        if (intent.minPrice) query = query.gte("price", intent.minPrice);
        if (intent.maxPrice) query = query.lte("price", intent.maxPrice);

        if (intent.sortBy === "price_asc") query = query.order("price", { ascending: true });
        else if (intent.sortBy === "price_desc") query = query.order("price", { ascending: false });
        else query = query.order("created_at", { ascending: false });

        const { data: products, error } = await query.limit(3);

        if (error) {
            return ctx.reply("❌ Error searching for products. Please try again.");
        }

        if (!products || products.length === 0) {
            return ctx.reply(
                "😕 Sorry, I couldn't find any products matching your search.\n\nTry different keywords or browse /deals for discounted items.",
                { parse_mode: "HTML" }
            );
        }

        await ctx.reply(`🔍 <b>Found ${products.length} product(s):</b>`, {
            parse_mode: "HTML",
        });

        for (const product of products) {
            const keyboard = new InlineKeyboard()
                .url("🛒 Buy Now", `https://kelalshop.com/checkout?product=${product.id}`)
                .url("🔍 View Details", `https://kelalshop.com/products/${product.id}`);

            await ctx.reply(`📦 <b>${product.name}</b>\n💰 ${product.price} ETB`, {
                parse_mode: "HTML",
                reply_markup: keyboard,
            });
        }
    });
}
