import { bot } from "../bot";
import { requireAdmin, supabase } from "../middleware";

bot.command("staff", requireAdmin, async (ctx) => {
    const { data: staff, error } = await supabase
        .from("telegram_admins")
        .select("telegram_chat_id, role, is_approved");

    if (error) {
        return ctx.reply("❌ Error fetching staff list.");
    }

    let message = "👥 **Staff Directory**\n\n";
    staff.forEach(s => {
        message += `- ID: ${s.telegram_chat_id} | Role: ${s.role} | Active: ${s.is_approved ? '✅' : '❌'}\n`;
    });

    await ctx.reply(message, { parse_mode: "Markdown" });
});
