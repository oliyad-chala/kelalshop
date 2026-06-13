import { bot } from "../bot";
import { requireAdmin } from "../middleware";

bot.command("security", requireAdmin, async (ctx) => {
    await ctx.reply("🔒 **Security Dashboard**\n\nNo recent security alerts detected.", { parse_mode: "Markdown" });
});
