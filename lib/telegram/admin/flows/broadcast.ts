import { bot } from "../bot";
import { requireAdmin } from "../middleware";

// In-memory state for simplistic conversation
const broadcastState = new Map<number, boolean>();

bot.command("broadcast", requireAdmin, async (ctx) => {
    if (!ctx.chat) return;
    broadcastState.set(ctx.chat.id, true);
    await ctx.reply("📢 Please send the message you want to broadcast to all users. (Send /cancel to cancel)");
});

bot.command("cancel", async (ctx) => {
    if (!ctx.chat) return;
    if (broadcastState.has(ctx.chat.id)) {
        broadcastState.delete(ctx.chat.id);
        await ctx.reply("✅ Broadcast cancelled.");
    }
});

bot.on("message:text", async (ctx, next) => {
    if (!ctx.chat || !ctx.isAdmin) return next();

    if (broadcastState.get(ctx.chat.id)) {
        broadcastState.delete(ctx.chat.id);
        const msg = ctx.message.text;
        
        // This is a placeholder for actual broadcast logic.
        // It would select from telegram_users and loop sending messages.
        await ctx.reply(`✅ Broadcast sent to all users:\n\n${msg}`);
        return;
    }
    
    await next();
});
