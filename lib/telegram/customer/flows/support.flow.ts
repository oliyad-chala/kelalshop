/**
 * support.flow.ts
 *
 * Exports:
 *  - handleSupportPrompt(ctx)  — sends the force-reply support prompt
 *  - registerSupportFlow(bot)  — registers the message:text interceptor
 */
import { CustomerContext } from "../bot";
import { supabase } from "../../admin/middleware";
import { Bot } from "grammy";

export async function handleSupportPrompt(ctx: CustomerContext) {
    await ctx.reply(
        "🎫 *Customer Support*\n\nPlease describe your issue in a single message below, and our team will get back to you\\.",
        {
            parse_mode: "MarkdownV2",
            reply_markup: { force_reply: true, selective: true },
        }
    );
}

export function registerSupportFlow(bot: Bot<CustomerContext>) {
    bot.command("support", handleSupportPrompt);

    bot.on("message:text", async (ctx, next) => {
        const replyToText = ctx.message.reply_to_message?.text;

        if (replyToText?.includes("describe your issue in a single message")) {
            const text = ctx.message.text.trim();
            if (text.startsWith("/")) return next();

            await ctx.replyWithChatAction("typing");

            let shopperId: string | null = null;
            if (ctx.chat) {
                const { data: user } = await supabase
                    .from("telegram_users")
                    .select("profile_id")
                    .eq("chat_id", ctx.chat.id)
                    .maybeSingle();
                if (user?.profile_id) shopperId = user.profile_id;
            }

            const { data: session, error: sessionError } = await supabase
                .from("support_sessions")
                .insert({
                    shopper_id: shopperId,
                    status: "open",
                    title: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
                })
                .select()
                .single();

            if (sessionError || !session) {
                return ctx.reply("❌ Error creating support ticket. Please try again later.");
            }

            await supabase.from("support_messages").insert({
                session_id: session.id,
                sender_type: "shopper",
                sender_id: shopperId,
                message: text,
            });

            return ctx.reply(
                `✅ *Ticket Created\\!*\n\nYour ticket ID is *\\#${session.id.slice(0, 8)}*\\.\nOur support team will review your message and reply soon\\.`,
                { parse_mode: "MarkdownV2" }
            );
        }

        await next();
    });
}
