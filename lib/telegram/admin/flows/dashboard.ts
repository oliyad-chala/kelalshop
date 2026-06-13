import { bot } from "../bot";
import { supabase } from "../middleware";

bot.command("dashboard", async (ctx) => {
    if (!ctx.isAdmin) return ctx.reply("⛔ Access Denied.");

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

    const dashboardText = `📊 **KelalShop Dashboard — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}**\n\n` +
        `👥 Total Users:       ${totalUsers || 0}\n` +
        `🏪 Active Sellers:     ${activeSellers || 0}\n` +
        `📦 Total Products:    ${totalProducts || 0}\n\n` +
        `🛒 Orders Today:         ${ordersToday || 0}\n` +
        `💰 Revenue Today:  ${revenueToday.toLocaleString()} ETB\n` +
        `⏳ Pending Approvals:     ${pendingApprovals || 0}\n\n` +
        `⚠️ Open Tickets:          ${openTickets || 0}\n` +
        `🔒 Security Alerts:        0`;

    await ctx.reply(dashboardText, { parse_mode: "Markdown" });
});
