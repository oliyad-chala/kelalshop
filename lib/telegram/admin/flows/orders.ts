import { bot } from "../bot";
import { supabase } from "../middleware";

bot.command("orders", async (ctx) => {
    if (!ctx.isAdmin) return ctx.reply("⛔ Access Denied.");
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, count, error } = await supabase
        .from("orders")
        .select("id, total_amount, status", { count: "exact" })
        .gte("created_at", today.toISOString());

    if (error) {
        return ctx.reply("❌ Error fetching orders.");
    }

    await ctx.reply(`📦 **Today's Orders**: ${count}\nStatus summary available via AI.`, { parse_mode: "Markdown" });
});
