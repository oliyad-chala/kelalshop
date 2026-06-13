import { InlineKeyboard } from "grammy";
import { bot } from "../bot";
import { supabase } from "../middleware";

bot.command("products", async (ctx) => {
    if (!ctx.isAdmin) return ctx.reply("⛔ Access Denied.");

    const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

    if (error) {
        return ctx.reply("❌ Error fetching products.");
    }

    await ctx.reply(`📦 **Total Products**: ${count}`, { parse_mode: "Markdown" });
});

bot.command("pending", async (ctx) => {
    if (!ctx.isAdmin) return ctx.reply("⛔ Access Denied.");

    const { data: pendingProducts, error } = await supabase
        .from("products")
        .select(`
            id,
            name,
            price,
            shopper_profiles ( store_name )
        `)
        .eq("is_available", false)
        .limit(5);

    if (error) {
        return ctx.reply("❌ Error fetching pending products.");
    }

    if (!pendingProducts || pendingProducts.length === 0) {
        return ctx.reply("✅ No pending products to review.");
    }

    for (const product of pendingProducts) {
        const storeName = product.shopper_profiles ? (product.shopper_profiles as any).store_name : "Unknown Store";
        const messageText = `📦 **${product.name}**\nSeller: ${storeName} | Price: ${product.price} ETB`;
        
        const keyboard = new InlineKeyboard()
            .text("✅ Approve", `approve_product_${product.id}`)
            .text("❌ Reject", `reject_product_${product.id}`)
            .row()
            .text("🔍 Details", `details_product_${product.id}`);

        await ctx.reply(messageText, { parse_mode: "Markdown", reply_markup: keyboard });
    }
});

bot.callbackQuery(/approve_product_(.*)/, async (ctx) => {
    if (!ctx.isAdmin) return ctx.answerCallbackQuery("⛔ Access Denied.");

    const productId = ctx.match[1];
    
    const { error } = await supabase
        .from("products")
        .update({ is_available: true })
        .eq("id", productId);

    if (error) {
        await ctx.answerCallbackQuery("❌ Error approving product.");
        return;
    }

    await ctx.editMessageText(`✅ Product Approved.`);
    await ctx.answerCallbackQuery("Product Approved!");
});

bot.callbackQuery(/reject_product_(.*)/, async (ctx) => {
    if (!ctx.isAdmin) return ctx.answerCallbackQuery("⛔ Access Denied.");

    const productId = ctx.match[1];
    
    // Simplification: In a real app we might delete or mark as rejected. For now, delete it or set a status.
    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

    if (error) {
        await ctx.answerCallbackQuery("❌ Error rejecting product.");
        return;
    }

    await ctx.editMessageText(`❌ Product Rejected.`);
    await ctx.answerCallbackQuery("Product Rejected!");
});

bot.callbackQuery(/details_product_(.*)/, async (ctx) => {
    if (!ctx.isAdmin) return ctx.answerCallbackQuery("⛔ Access Denied.");

    const productId = ctx.match[1];
    await ctx.answerCallbackQuery("Details feature coming soon.");
});
