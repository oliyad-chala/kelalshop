import { NextResponse } from "next/server";
import { broadcastToAdmins, NotificationTemplates } from "@/lib/telegram/notifications";

export async function POST(request: Request) {
    // 1. Verify internal API key
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { event, payload } = body;

        let message = "";

        switch (event) {
            case "NEW_ORDER":
                message = NotificationTemplates.newOrder(payload.orderId, payload.amount);
                break;
            case "NEW_SELLER":
                message = NotificationTemplates.newSeller(payload.storeName);
                break;
            case "PRODUCT_PENDING":
                message = NotificationTemplates.productPending(payload.productName);
                break;
            case "PRODUCT_APPROVED":
                message = NotificationTemplates.productApproved(payload.productName);
                break;
            case "PRODUCT_REJECTED":
                message = NotificationTemplates.productRejected(payload.productName, payload.reason);
                break;
            case "WITHDRAWAL_REQUEST":
                message = NotificationTemplates.withdrawalRequest(payload.sellerName, payload.amount);
                break;
            case "SUPPORT_TICKET":
                message = NotificationTemplates.supportTicket(payload.ticketId, payload.subject);
                break;
            case "SUSPICIOUS_ACTIVITY":
                message = NotificationTemplates.suspiciousActivity(payload.userId, payload.description);
                break;
            default:
                return NextResponse.json({ error: "Unknown event type" }, { status: 400 });
        }

        if (message) {
            await broadcastToAdmins(message);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error processing notification:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
