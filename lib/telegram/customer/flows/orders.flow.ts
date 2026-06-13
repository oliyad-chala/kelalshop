/**
 * orders.flow.ts
 *
 * Exports:
 *  - handleOrders(ctx)         — shows recent orders (with inline auth check)
 *  - registerOrdersFlow(bot)   — registers /orders and /track commands
 */
import { InlineKeyboard, Bot } from "grammy";
import { CustomerContext } from "../bot";
import { supabase } from "../../admin/middleware";

async function getLinkedUser(chatId: number) {
    const { data: user, error } = await supabase
        .from("telegram_users")
        .select("profile_id, is_verified")
        .eq("chat_id", chatId)
        .maybeSingle();

    if (error || !user || !user.is_verified) return null;
    return user;
}

export async function handleOrders(ctx: CustomerContext) {
    if (!ctx.chat) return;
    await ctx.replyWithChatAction("typing");

    const user = await getLinkedUser(ctx.chat.id);
    if (!user) {
        return ctx.reply(
            "❌ *You need to link your KelalShop account first\\.*\n\nUse /link or the ⚙️ *Profile / Link Account* button to get started\\.",
            { parse_mode: "MarkdownV2" }
        );
    }

    const { data: orders, error } = await supabase
        .from("orders")
        .select("id, total_amount, status, created_at")
        .eq("shopper_id", user.profile_id)
        .order("created_at", { ascending: false })
        .limit(5);

    if (error) return ctx.reply("❌ Error fetching your orders.");

    if (!orders || orders.length === 0) return ctx.reply("✅ You have no recent orders.");

    let message = "📦 *Your Recent Orders*\n\n";
    orders.forEach((order) => {
        const date = new Date(order.created_at)
            .toLocaleDateString()
            .replace(/\//g, "\\/");
        const emoji =
            order.status === "delivered" ? "✅" : order.status === "cancelled" ? "❌" : "⏳";
        const orderId = order.id.slice(0, 8);
        const amount = order.total_amount.toString().replace(/\./g, "\\.");
        const statusStr = order.status.toUpperCase();

        message += `${emoji} *Order \\#${orderId}*\n`;
        message += `📅 Date: _${date}_\n`;
        message += `💰 Amount: *${amount} ETB*\n`;
        message += `📊 Status: *${statusStr}*\n\n`;
    });

    await ctx.reply(message, { parse_mode: "MarkdownV2" });
}

export function registerOrdersFlow(bot: Bot<CustomerContext>) {
    bot.command("orders", handleOrders);

    bot.command("track", async (ctx) => {
        if (!ctx.chat) return;
        await ctx.replyWithChatAction("typing");

        const user = await getLinkedUser(ctx.chat.id);
        if (!user) {
            return ctx.reply(
                "❌ *You need to link your KelalShop account first\\.*\n\nUse /link or the ⚙️ *Profile / Link Account* button to get started\\.",
                { parse_mode: "MarkdownV2" }
            );
        }

        const { data: orders, error } = await supabase
            .from("orders")
            .select("id, status")
            .eq("shopper_id", user.profile_id)
            .in("status", ["pending", "processing", "shipped"])
            .order("created_at", { ascending: false })
            .limit(3);

        if (error || !orders || orders.length === 0) {
            return ctx.reply("✅ You have no active orders to track.");
        }

        for (const order of orders) {
            const keyboard = new InlineKeyboard();
            const orderId = order.id.slice(0, 8);
            const statusStr = order.status.toUpperCase();

            if (order.status === "pending") {
                keyboard.text("❌ Cancel Order", `cancel_order_${order.id}`);
            }
            keyboard.url("🌐 View on Website", `https://kelalshop.com/orders/${order.id}`);

            await ctx.reply(
                `🚚 *Track Order \\#${orderId}*\n\nCurrent Status: *${statusStr}*`,
                { parse_mode: "MarkdownV2", reply_markup: keyboard }
            );
        }
    });

    bot.callbackQuery(/cancel_order_(.*)/, async (ctx) => {
        const orderId = ctx.match[1];
        const { error } = await supabase
            .from("orders")
            .update({ status: "cancelled" })
            .eq("id", orderId)
            .eq("status", "pending");

        if (error) {
            return ctx.answerCallbackQuery(
                "❌ Error cancelling order. It may have already been processed."
            );
        }
        await ctx.editMessageText(`❌ Order #${orderId.slice(0, 8)} has been cancelled.`);
        await ctx.answerCallbackQuery("Order cancelled.");
    });

    bot.callbackQuery(/view_order_(.*)/, async (ctx) => {
        await ctx.answerCallbackQuery("Detailed view coming soon!");
    });
}
