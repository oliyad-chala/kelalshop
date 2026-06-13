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

    // First check: env var ADMIN_CHAT_ID (fast, no DB needed)
    const envAdminId = process.env.ADMIN_CHAT_ID ? parseInt(process.env.ADMIN_CHAT_ID) : null;
    if (envAdminId && chatId === envAdminId) {
        ctx.isAdmin = true;
        ctx.adminRole = 'admin';
        await next();
        return;
    }

    // Second check: Supabase database
    try {
        const { data: admin, error } = await supabase
            .from("telegram_admins")
            .select("is_approved, role")
            .eq("telegram_chat_id", chatId)
            .maybeSingle();

        if (error) {
            console.error(`[Auth] Supabase error: ${error.message}`);
        }

        ctx.isAdmin = !!(admin && admin.is_approved);
        if (ctx.isAdmin) {
            ctx.adminRole = admin?.role as 'admin' | 'staff';
        }
    } catch (err) {
        console.error("[Auth] Exception querying DB:", err);
        ctx.isAdmin = false;
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
