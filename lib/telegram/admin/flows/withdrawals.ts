import { bot } from "../bot";
import { requireAdmin, supabase } from "../middleware";
import { InlineKeyboard } from "grammy";

bot.command("withdrawals", requireAdmin, async (ctx) => {
    const { data: requests, error } = await supabase
        .from("payment_requests")
        .select(`
            id,
            amount,
            status,
            shopper_profiles ( store_name )
        `)
        .eq("status", "pending")
        .limit(5);

    if (error) {
        return ctx.reply("❌ Error fetching withdrawals.");
    }

    if (!requests || requests.length === 0) {
        return ctx.reply("✅ No pending withdrawal requests.");
    }

    for (const req of requests) {
        const storeName = req.shopper_profiles ? (req.shopper_profiles as any).store_name : "Unknown Store";
        const messageText = `💸 **Withdrawal Request**\nStore: ${storeName}\nAmount: ${req.amount} ETB`;
        
        const keyboard = new InlineKeyboard()
            .text("✅ Approve", `approve_withdrawal_${req.id}`)
            .text("❌ Reject", `reject_withdrawal_${req.id}`);

        await ctx.reply(messageText, { parse_mode: "Markdown", reply_markup: keyboard });
    }
});

bot.callbackQuery(/approve_withdrawal_(.*)/, async (ctx) => {
    if (ctx.adminRole !== 'admin') return ctx.answerCallbackQuery("⛔ Admin privileges required.");

    const reqId = ctx.match[1];
    
    const { error } = await supabase
        .from("payment_requests")
        .update({ status: "approved" })
        .eq("id", reqId);

    if (error) return ctx.answerCallbackQuery("❌ Error approving.");

    await ctx.editMessageText(`✅ Withdrawal Approved.`);
});

bot.callbackQuery(/reject_withdrawal_(.*)/, async (ctx) => {
    if (ctx.adminRole !== 'admin') return ctx.answerCallbackQuery("⛔ Admin privileges required.");

    const reqId = ctx.match[1];
    
    const { error } = await supabase
        .from("payment_requests")
        .update({ status: "rejected" })
        .eq("id", reqId);

    if (error) return ctx.answerCallbackQuery("❌ Error rejecting.");

    await ctx.editMessageText(`❌ Withdrawal Rejected.`);
});
