import { bot } from "../bot";
import { supabase, requireAdmin } from "../middleware";

bot.command("revenue", requireAdmin, async (ctx) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const { data: todayData, error: todayError } = await supabase
        .from("orders")
        .select("total_amount")
        .gte("created_at", today.toISOString())
        .in("status", ["delivered", "paid"]);

    const { data: weekData, error: weekError } = await supabase
        .from("orders")
        .select("total_amount")
        .gte("created_at", startOfWeek.toISOString())
        .in("status", ["delivered", "paid"]);

    if (todayError || weekError) {
        return ctx.reply("❌ Error fetching revenue.");
    }

    const todayRevenue = todayData.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
    const weekRevenue = weekData.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);

    await ctx.reply(`💰 **Revenue**\n\nToday: ${todayRevenue.toLocaleString()} ETB\nThis Week: ${weekRevenue.toLocaleString()} ETB`, { parse_mode: "Markdown" });
});
