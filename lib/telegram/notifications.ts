import { bot } from "./admin/bot";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Sends a message to all approved admins/staff.
 */
export async function broadcastToAdmins(message: string) {
    const { data: admins, error } = await supabase
        .from("telegram_admins")
        .select("telegram_chat_id")
        .eq("is_approved", true);

    if (error || !admins) {
        console.error("Failed to fetch admins for broadcasting:", error);
        return;
    }

    const promises = admins.map((admin) => 
        bot.api.sendMessage(admin.telegram_chat_id, message, { parse_mode: "HTML" }).catch(e => {
            console.error(`Failed to send message to ${admin.telegram_chat_id}:`, e);
        })
    );

    await Promise.all(promises);
}

// Pre-defined templates for various events
export const NotificationTemplates = {
    newOrder: (orderId: string, amount: number) => 
        `🛍️ <b>New Order Placed!</b>\nOrder ID: <code>${orderId}</code>\nTotal Amount: <b>$${amount.toFixed(2)}</b>`,
    
    newSeller: (storeName: string) =>
        `🏪 <b>New Seller Registered</b>\nStore Name: <b>${storeName}</b>\nPending approval.`,
        
    productPending: (productName: string) =>
        `📦 <b>Product Pending Approval</b>\nProduct: <b>${productName}</b>\nReview required.`,
        
    productApproved: (productName: string) =>
        `✅ <b>Product Approved</b>\nProduct: <b>${productName}</b> is now live.`,
        
    productRejected: (productName: string, reason?: string) =>
        `❌ <b>Product Rejected</b>\nProduct: <b>${productName}</b>\nReason: ${reason || "Not specified."}`,
        
    withdrawalRequest: (sellerName: string, amount: number) =>
        `💸 <b>Withdrawal Request</b>\nSeller: <b>${sellerName}</b>\nAmount: <b>$${amount.toFixed(2)}</b>`,
        
    supportTicket: (ticketId: string, subject: string) =>
        `🎫 <b>New Support Ticket</b>\nTicket ID: <code>${ticketId}</code>\nSubject: <b>${subject}</b>`,
        
    suspiciousActivity: (userId: string, description: string) =>
        `🚨 <b>Suspicious Activity Detected</b>\nUser ID: <code>${userId}</code>\nDetails: <b>${description}</b>`,
};
