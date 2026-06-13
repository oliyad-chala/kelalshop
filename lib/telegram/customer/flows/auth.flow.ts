import { customerBot } from "../bot";
import { supabase } from "../../admin/middleware";

customerBot.command("link", async (ctx) => {
    ctx.session.state = "AWAITING_EMAIL";
    await ctx.reply("🔗 **Account Linking**\n\nPlease enter the email address associated with your KelalShop account:", { parse_mode: "Markdown" });
});

// We need to intercept text messages if state is AWAITING_EMAIL or AWAITING_OTP
customerBot.on("message:text", async (ctx, next) => {
    const text = ctx.message.text.trim();
    const state = ctx.session.state;

    if (state === "AWAITING_EMAIL") {
        if (!text.includes("@")) {
            return ctx.reply("❌ That doesn't look like a valid email. Please try again.");
        }

        // Verify if email exists in our profiles
        const { data: profile, error } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", text.toLowerCase())
            .maybeSingle();

        if (error || !profile) {
            ctx.session.state = "IDLE";
            return ctx.reply("❌ We couldn't find an account with that email. Please register on the website first.");
        }

        // Generate a 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Upsert into telegram_users
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        await supabase.from("telegram_users").upsert({
            chat_id: ctx.chat.id,
            profile_id: profile.id,
            username: ctx.from.username,
            first_name: ctx.from.first_name,
            otp_code: otpCode,
            otp_expires_at: expiresAt.toISOString(),
            otp_attempts: 0,
            is_verified: false
        }, { onConflict: "chat_id" });

        ctx.session.email = text.toLowerCase();
        ctx.session.state = "AWAITING_OTP";
        
        // Output to console since no email provider is configured
        console.log(`\n\n========================================`);
        console.log(`🔐 OTP for ${text}: ${otpCode}`);
        console.log(`========================================\n\n`);

        return ctx.reply(`✅ An OTP has been generated (check your server console since no email provider is configured).\n\nPlease enter the 6-digit code:`);
    }

    if (state === "AWAITING_OTP") {
        const { data: user, error } = await supabase
            .from("telegram_users")
            .select("*")
            .eq("chat_id", ctx.chat.id)
            .maybeSingle();

        if (error || !user) {
            ctx.session.state = "IDLE";
            return ctx.reply("❌ Session expired. Please start over with /link.");
        }

        if (new Date() > new Date(user.otp_expires_at)) {
            ctx.session.state = "IDLE";
            return ctx.reply("❌ OTP has expired. Please start over with /link.");
        }

        if (user.otp_attempts >= 3) {
            ctx.session.state = "IDLE";
            return ctx.reply("❌ Too many failed attempts. Please start over with /link.");
        }

        if (text === user.otp_code) {
            // Success
            await supabase.from("telegram_users").update({
                is_verified: true,
                otp_code: null,
                linked_at: new Date().toISOString()
            }).eq("chat_id", ctx.chat.id);

            ctx.session.state = "IDLE";
            return ctx.reply("🎉 **Account Successfully Linked!**\n\nYou can now use commands like /orders to manage your account.", { parse_mode: "Markdown" });
        } else {
            // Fail
            const newAttempts = user.otp_attempts + 1;
            await supabase.from("telegram_users").update({ otp_attempts: newAttempts }).eq("chat_id", ctx.chat.id);
            
            if (newAttempts >= 3) {
                ctx.session.state = "IDLE";
                return ctx.reply("❌ Too many failed attempts. Please start over with /link.");
            }
            
            return ctx.reply(`❌ Incorrect code. You have ${3 - newAttempts} attempts left. Try again:`);
        }
    }

    // Pass down to other handlers if not in auth flow
    await next();
});
