import { InlineKeyboard } from "grammy";
import { customerBot } from "../bot";
import { supabase } from "../../admin/middleware";

// Middleware to ensure user is linked
async function ensureLinked(ctx: any, next: () => Promise<void>) {
    if (!ctx.chat) return;

    const { data: user, error } = await supabase
        .from("telegram_users")
        .select("profile_id, is_verified")
        .eq("chat_id", ctx.chat.id)
        .maybeSingle();

    if (error || !user || !user.is_verified) {
        return ctx.reply("❌ **You need to link your KelalShop account first.**\n\nPlease use the /link command to start.", { parse_mode: "Markdown" });
    }

    ctx.user = user;
    await next();
}

customerBot.command("orders", ensureLinked, async (ctx) => {
    const profileId = ctx.user.profile_id;

    const { data: orders, error } = await supabase
        .from("orders")
        .select("id, total_amount, status, created_at")
        .eq("shopper_id", profileId)
        .order("created_at", { ascending: false })
        .limit(5);

    if (error) {
        return ctx.reply("❌ Error fetching your orders.");
    }

    if (!orders || orders.length === 0) {
        return ctx.reply("✅ You have no recent orders.");
    }

    let message = "📦 **Your Recent Orders**\n\n";
    orders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString();
        const emoji = order.status === "delivered" ? "✅" : (order.status === "cancelled" ? "❌" : "⏳");
        message += `${emoji} **Order #${order.id.slice(0, 8)}**\n`;
        message += `Date: ${date} | Amount: ${order.total_amount} ETB\n`;
        message += `Status: ${order.status.toUpperCase()}\n\n`;
    });

    await ctx.reply(message, { parse_mode: "Markdown" });
});

customerBot.command("track", ensureLinked, async (ctx) => {
    const profileId = ctx.user.profile_id;

    const { data: orders, error } = await supabase
        .from("orders")
        .select("id, status")
        .eq("shopper_id", profileId)
        .in("status", ["pending", "processing", "shipped"])
        .order("created_at", { ascending: false })
        .limit(3);

    if (error || !orders || orders.length === 0) {
        return ctx.reply("✅ You have no active orders to track.");
    }

    for (const order of orders) {
        const keyboard = new InlineKeyboard();
        
        if (order.status === "pending") {
            keyboard.text("❌ Cancel Order", `cancel_order_${order.id}`);
        } else {
            keyboard.text("🔍 View Details", `view_order_${order.id}`);
        }

        await ctx.reply(`📦 **Order #${order.id.slice(0, 8)}**\nCurrent Status: **${order.status.toUpperCase()}**`, { 
            parse_mode: "Markdown",
            reply_markup: keyboard
        });
    }
});

customerBot.callbackQuery(/cancel_order_(.*)/, async (ctx) => {
    const orderId = ctx.match[1];
    
    const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId)
        .eq("status", "pending"); // Only allow cancelling pending orders

    if (error) {
        return ctx.answerCallbackQuery("❌ Error cancelling order. It may have already been processed.");
    }

    await ctx.editMessageText(`❌ Order #${orderId.slice(0, 8)} has been cancelled.`);
});

customerBot.callbackQuery(/view_order_(.*)/, async (ctx) => {
    await ctx.answerCallbackQuery("Detailed view coming soon!");
});
