/**
 * deals.flow.ts
 *
 * Exports:
 *  - handleDeals(ctx)         — fetches and displays active flash deals
 *  - registerDealsFlow(bot)   — registers the /deals command
 */
import { InlineKeyboard, Bot } from "grammy";
import { CustomerContext } from "../bot";
import { supabase } from "../../admin/middleware";

export async function handleDeals(ctx: CustomerContext) {
    await ctx.replyWithChatAction("typing");

    const { data: promotions, error } = await supabase
        .from("promotions")
        .select("id, name, discount_percent, end_date")
        .eq("is_active", true)
        .order("discount_percent", { ascending: false })
        .limit(5);

    if (error || !promotions || promotions.length === 0) {
        return ctx.reply("✅ There are no active flash sales right now. Check back later!");
    }

    await ctx.reply(`⚡ *Active Flash Deals* — ${promotions.length} deal(s) found\\!`, {
        parse_mode: "MarkdownV2",
    });

    for (const promo of promotions) {
        const safeName = promo.name.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
        const discount = promo.discount_percent.toString();
        const endInfo = promo.end_date
            ? `\nEnds: _${new Date(promo.end_date)
                  .toLocaleDateString()
                  .replace(/\//g, "\\/")}_ `
            : "";

        const keyboard = new InlineKeyboard().url("🛒 Shop This Deal", `https://kelalshop.com/deals`);

        await ctx.reply(
            `⚡ *${safeName}*\n💥 Up to *${discount}%* off selected items\\!${endInfo}`,
            { parse_mode: "MarkdownV2", reply_markup: keyboard }
        );
    }
}

export function registerDealsFlow(bot: Bot<CustomerContext>) {
    bot.command("deals", handleDeals);
}
