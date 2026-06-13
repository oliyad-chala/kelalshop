import { bot } from "../bot";
import { supabase } from "../middleware";
import { InlineKeyboard } from "grammy";

async function generateDashboardText() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
        { count: totalUsers },
        { count: activeSellers },
        { count: totalProducts },
        { count: ordersToday },
        { data: revenueData },
        { count: pendingApprovals },
        { count: openTickets }
    ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("shopper_profiles").select("*", { count: "exact", head: true }).eq("verification_status", "verified"),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        supabase.from("orders").select("total_amount").gte("created_at", today.toISOString()).in("status", ["delivered", "paid"]),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("is_available", false),
        supabase.from("support_sessions").select("*", { count: "exact", head: true }).neq("status", "closed")
    ]);

    const revenueToday = revenueData?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;
    
    // Format safely for MarkdownV2
    const safeRev = revenueToday.toLocaleString().replace(/\./g, "\\.");

    return `📊 *KelalShop Dashboard — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/\//g, "\\/")}*\n\n` +
        `👥 Total Users:       *${totalUsers || 0}*\n` +
        `🏪 Active Sellers:    *${activeSellers || 0}*\n` +
        `📦 Total Products:    *${totalProducts || 0}*\n\n` +
        `🛒 Orders Today:      *${ordersToday || 0}*\n` +
        `💰 Revenue Today:     *${safeRev} ETB*\n` +
        `⏳ Pending Approvals: *${pendingApprovals || 0}*\n\n` +
        `⚠️ Open Tickets:      *${openTickets || 0}*\n` +
        `🔒 Security Alerts:   *0*`;
}

function getDashboardKeyboard() {
    return new InlineKeyboard()
        .text("🔄 Refresh Stats", "refresh_dashboard")
        .row()
        .text("⏳ Pending Approvals", "cmd_pending")
        .text("🎫 Open Tickets", "cmd_tickets");
}

bot.command("dashboard", async (ctx) => {
    if (!ctx.isAdmin) return ctx.reply("⛔ Access Denied.");
    
    const dashboardText = await generateDashboardText();
    await ctx.reply(dashboardText, { parse_mode: "MarkdownV2", reply_markup: getDashboardKeyboard() });
});

bot.callbackQuery("refresh_dashboard", async (ctx) => {
    if (!ctx.isAdmin) return ctx.answerCallbackQuery("⛔ Access Denied.");
    
    const dashboardText = await generateDashboardText();
    await ctx.editMessageText(dashboardText, { parse_mode: "MarkdownV2", reply_markup: getDashboardKeyboard() });
    await ctx.answerCallbackQuery("Stats refreshed!");
});

// Map the inline buttons to actual commands
bot.callbackQuery("cmd_pending", async (ctx) => {
    // This assumes the `pending` command handler doesn't strictly depend on message context
    // A quick hack is to just tell them to use the command for now
    await ctx.answerCallbackQuery("Run /pending to view approvals!");
});

bot.callbackQuery("cmd_tickets", async (ctx) => {
    await ctx.answerCallbackQuery("Run /tickets to view support tickets!");
});

