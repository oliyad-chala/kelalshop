/**
 * auth.flow.ts
 *
 * Exports:
 *  - handleLinkPrompt(ctx)  — triggers the account-linking conversation
 *  - registerAuthFlow(bot)  — registers the grammy message:text interceptor
 *
 * commands.ts calls registerAuthFlow() in the correct order.
 */
import { CustomerContext } from "../bot";
import { supabase } from "../../admin/middleware";
import { Bot } from "grammy";

export async function handleLinkPrompt(ctx: CustomerContext) {
    await ctx.reply(
        "🔗 *Account Linking*\n\nPlease enter the email address associated with your KelalShop account:",
        {
            parse_mode: "MarkdownV2",
            reply_markup: { force_reply: true, selective: true },
        }
    );
}

export function registerAuthFlow(bot: Bot<CustomerContext>) {
    bot.command("link", handleLinkPrompt);

    bot.on("message:text", async (ctx, next) => {
        const text = ctx.message.text.trim();
        const replyToText = ctx.message.reply_to_message?.text;

        if (replyToText?.includes("enter the email address")) {
            if (!text.includes("@")) {
                return ctx.reply("❌ That doesn't look like a valid email. Please try again.");
            }

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("id")
                .eq("email", text.toLowerCase())
                .maybeSingle();

            if (error || !profile) {
                return ctx.reply(
                    "❌ We couldn't find an account with that email. Please register on the website first."
                );
            }

            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            await supabase.from("telegram_users").upsert(
                {
                    chat_id: ctx.chat!.id,
                    profile_id: profile.id,
                    username: ctx.from?.username,
                    first_name: ctx.from?.first_name,
                    otp_code: otpCode,
                    otp_expires_at: expiresAt.toISOString(),
                    otp_attempts: 0,
                    is_verified: false,
                },
                { onConflict: "chat_id" }
            );

            console.log(`\n========================================`);
            console.log(`🔐 OTP for ${text}: ${otpCode}`);
            console.log(`========================================\n`);

            return ctx.reply(
                "✅ An OTP code has been generated\\.\n\nPlease check your server console and enter the 6\\-digit code:",
                {
                    parse_mode: "MarkdownV2",
                    reply_markup: { force_reply: true, selective: true },
                }
            );
        }

        if (replyToText?.includes("enter the 6") || replyToText?.includes("6\\-digit code")) {
            const { data: user, error } = await supabase
                .from("telegram_users")
                .select("*")
                .eq("chat_id", ctx.chat!.id)
                .maybeSingle();

            if (error || !user) {
                return ctx.reply("❌ Session expired. Please start over with /link.");
            }

            if (new Date() > new Date(user.otp_expires_at)) {
                return ctx.reply("❌ OTP has expired. Please start over with /link.");
            }

            if (user.otp_attempts >= 3) {
                return ctx.reply("❌ Too many failed attempts. Please start over with /link.");
            }

            if (text === user.otp_code) {
                await supabase
                    .from("telegram_users")
                    .update({
                        is_verified: true,
                        otp_code: null,
                        linked_at: new Date().toISOString(),
                    })
                    .eq("chat_id", ctx.chat!.id);

                return ctx.reply(
                    "🎉 *Account Successfully Linked\\!*\n\nYou can now use commands like /orders to manage your account\\.",
                    { parse_mode: "MarkdownV2" }
                );
            } else {
                const newAttempts = user.otp_attempts + 1;
                await supabase
                    .from("telegram_users")
                    .update({ otp_attempts: newAttempts })
                    .eq("chat_id", ctx.chat!.id);

                if (newAttempts >= 3) {
                    return ctx.reply("❌ Too many failed attempts. Please start over with /link.");
                }

                return ctx.reply(
                    `❌ Incorrect code\\. *${3 - newAttempts}* attempt(s) remaining\\. Try again:`,
                    {
                        parse_mode: "MarkdownV2",
                        reply_markup: { force_reply: true, selective: true },
                    }
                );
            }
        }

        await next();
    });
}
