import { customerBot } from "../bot";
import { supabase } from "../../admin/middleware";

customerBot.command("support", async (ctx) => {
    await ctx.reply(
        "🎫 **Customer Support**\n\n" +
        "Please describe your issue in a single message below, and our team will get back to you.",
        { 
            parse_mode: "Markdown",
            reply_markup: { force_reply: true, selective: true }
        }
    );
});

customerBot.on("message:text", async (ctx, next) => {
    const replyToText = ctx.message.reply_to_message?.text;

    if (replyToText?.includes("describe your issue in a single message")) {
        const text = ctx.message.text.trim();
        
        if (text.startsWith("/")) return next();

        await ctx.replyWithChatAction("typing");

        // Attempt to identify user
        let shopperId = null;
        if (ctx.chat) {
            const { data: user } = await supabase
                .from("telegram_users")
                .select("profile_id")
                .eq("chat_id", ctx.chat.id)
                .maybeSingle();
                
            if (user && user.profile_id) shopperId = user.profile_id;
        }

        // Create support session
        const { data: session, error: sessionError } = await supabase
            .from("support_sessions")
            .insert({
                shopper_id: shopperId, // null if guest
                status: "open",
                title: text.substring(0, 50) + "..."
            })
            .select()
            .single();

        if (sessionError || !session) {
            return ctx.reply("❌ Error creating support ticket. Please try again later.");
        }

        // Add message to session
        await supabase
            .from("support_messages")
            .insert({
                session_id: session.id,
                sender_type: "shopper",
                sender_id: shopperId,
                message: text
            });

        return ctx.reply(`✅ **Ticket Created!**\n\nYour ticket ID is #${session.id.slice(0, 8)}.\nOur support team will review your message and reply soon.`, { parse_mode: "Markdown" });
    }

    await next();
});
