import { InlineKeyboard } from "grammy";
import { customerBot } from "../bot";
import { supabase } from "../../admin/middleware";
import { extractShoppingIntent, answerCustomerFAQ } from "../../../gemini/shopping-assistant";

customerBot.command("search", async (ctx) => {
    await ctx.reply("🔍 What are you looking for? (e.g., 'gaming laptop under 80000 ETB')");
});

// Update the message text handler for search and FAQ
customerBot.on("message:text", async (ctx, next) => {
    const text = ctx.message.text.trim();
    
    // Auth flow now handles states via ForceReply, so no session check is needed.

    // Ignore commands
    if (text.startsWith("/")) return next();

    await ctx.replyWithChatAction("typing");

    // If it looks like a question, use FAQ, otherwise use search
    if (text.toLowerCase().includes("how") || text.toLowerCase().includes("where") || text.toLowerCase().includes("what is") || text.endsWith("?")) {
        const answer = await answerCustomerFAQ(text);
        return ctx.reply(answer, { parse_mode: "Markdown" });
    }

    // Treat as product search
    const intent = await extractShoppingIntent(text);
    
    let query = supabase.from("products").select("id, name, price").eq("is_available", true);
    
    if (intent.keywords && intent.keywords.length > 0) {
        // Use ilike for simple text search on name
        const likeSearch = `%${intent.keywords.join('%')}%`;
        query = query.ilike("name", likeSearch);
    }
    
    if (intent.minPrice) query = query.gte("price", intent.minPrice);
    if (intent.maxPrice) query = query.lte("price", intent.maxPrice);
    
    if (intent.sortBy === "price_asc") query = query.order("price", { ascending: true });
    else if (intent.sortBy === "price_desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false }); // newest default
    
    const { data: products, error } = await query.limit(3);

    if (error) {
        return ctx.reply("❌ Error searching for products.");
    }

    if (!products || products.length === 0) {
        return ctx.reply("😕 Sorry, I couldn't find any products matching your search.");
    }

    await ctx.reply(`🔍 *Found ${products.length} products:*`, { parse_mode: "MarkdownV2" });

    for (const product of products) {
        // Escape special characters for MarkdownV2
        const safeName = product.name.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
        const safePrice = product.price.toString().replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");

        const keyboard = new InlineKeyboard()
            .url("🛒 Buy Now", `https://kelalshop.com/checkout?product=${product.id}`)
            .url("🔍 View Details", `https://kelalshop.com/products/${product.id}`);

        await ctx.reply(`📦 *${safeName}*\n💰 ${safePrice} ETB`, { 
            parse_mode: "MarkdownV2",
            reply_markup: keyboard
        });
    }
});
