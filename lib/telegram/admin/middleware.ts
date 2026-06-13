import { NextFunction } from "grammy";
import { createClient } from "@supabase/supabase-js";
import { BotContext } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const authMiddleware = async (ctx: BotContext, next: NextFunction) => {
    if (!ctx.chat || !ctx.from) {
        return;
    }

    const chatId = ctx.chat.id;

    // Debug: log what we're looking up
    console.log(`[Auth] Checking chat ID: ${chatId}`);
    console.log(`[Auth] Supabase URL set: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    console.log(`[Auth] Service key set: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);

    const { data: admin, error } = await supabase
        .from("telegram_admins")
        .select("is_approved, role")
        .eq("telegram_chat_id", chatId)
        .maybeSingle();

    if (error) {
        console.error(`[Auth] Supabase error: ${error.message}`);
    }

    console.log(`[Auth] Admin record found: ${JSON.stringify(admin)}`);

    ctx.isAdmin = !!(admin && admin.is_approved);
    if (ctx.isAdmin) {
        ctx.adminRole = admin?.role as 'admin' | 'staff';
    }
    
    await next();
};

export async function requireAdmin(ctx: BotContext, next: NextFunction) {
    if (!ctx.isAdmin) {
        return ctx.reply("⛔ Access Denied.");
    }
    if (ctx.adminRole !== 'admin') {
        return ctx.reply("⛔ This command requires Admin privileges.");
    }
    await next();
}
