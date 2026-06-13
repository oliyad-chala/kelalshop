import { NextResponse } from "next/server";
import { customerBot } from "@/lib/telegram/customer/bot";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { event, payload, targetProfileId } = body;

        let message = "";

        switch (event) {
            case "ORDER_ACCEPTED":
                message = `✅ **Your order #${payload.orderId.slice(0, 8)} has been accepted!**`;
                break;
            case "ORDER_SHIPPED":
                message = `🚚 **Your order #${payload.orderId.slice(0, 8)} is on the way!**\nETA: 14 days`;
                break;
            case "ORDER_DELIVERED":
                message = `📦 **Your order #${payload.orderId.slice(0, 8)} has been delivered!**\nThank you for shopping with us!`;
                break;
            case "ORDER_CANCELLED":
                message = `❌ **Your order #${payload.orderId.slice(0, 8)} was cancelled.**`;
                break;
            case "FLASH_SALE":
                message = `⚡ **Flash Sale starting now!**\nCheck out our latest deals with /deals.`;
                break;
            case "TICKET_REPLY":
                message = `🎫 **Support replied to your ticket #${payload.ticketId.slice(0, 8)}:**\n\n"${payload.message}"`;
                break;
            default:
                message = `📢 **Notification:**\n${payload.message || "You have a new update."}`;
        }

        // If a specific profile ID is targeted
        if (targetProfileId) {
            const { data: user } = await supabase
                .from("telegram_users")
                .select("chat_id")
                .eq("profile_id", targetProfileId)
                .maybeSingle();

            if (user?.chat_id) {
                await customerBot.api.sendMessage(user.chat_id, message, { parse_mode: "Markdown" });
            }
        } 
        // Broadcast to all linked users
        else if (event === "FLASH_SALE" || event === "BROADCAST") {
            const { data: users } = await supabase
                .from("telegram_users")
                .select("chat_id");

            if (users) {
                for (const user of users) {
                    try {
                        await customerBot.api.sendMessage(user.chat_id, message, { parse_mode: "Markdown" });
                    } catch (e) {
                        console.error("Failed to send message to", user.chat_id, e);
                    }
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error sending customer notification:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
