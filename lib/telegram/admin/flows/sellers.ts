import { bot } from "../bot";
import { supabase } from "../middleware";

bot.command("sellers", async (ctx) => {
    if (!ctx.isAdmin) return ctx.reply("⛔ Access Denied.");

    const { count, error } = await supabase
        .from("shopper_profiles")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "pending");

    if (error) {
        return ctx.reply("❌ Error fetching sellers.");
    }

    if (count === 0) {
        return ctx.reply("✅ No pending seller applications.");
    }

    await ctx.reply(`🏪 **Pending Sellers**: ${count}\nPlease review them in the web dashboard.`, { parse_mode: "Markdown" });
});
