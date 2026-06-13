import { InlineKeyboard } from "grammy";
import { customerBot } from "../bot";
import { supabase } from "../../admin/middleware";

customerBot.command("deals", async (ctx) => {
    // In a real app, query 'promotions' and 'promotion_products'
    // For this implementation plan, we'll return a simulated response if tables are empty.
    const { data: promotions, error } = await supabase
        .from("promotions")
        .select("id, name, discount_percent")
        .eq("is_active", true)
        .limit(1);

    if (error || !promotions || promotions.length === 0) {
        return ctx.reply("✅ There are no active flash sales right now. Check back later!");
    }

    const promo = promotions[0];
    
    await ctx.reply(`⚡ **${promo.name}**\nEnjoy up to ${promo.discount_percent}% off on selected items!`, { 
        parse_mode: "Markdown"
    });
});
