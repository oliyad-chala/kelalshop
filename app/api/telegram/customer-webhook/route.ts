import { customerBot } from "@/lib/telegram/customer/bot";
// Import commands to ensure they are registered
import "@/lib/telegram/customer/commands";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const secretToken = req.headers.get("x-telegram-bot-api-secret-token");

    if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
        console.error("Unauthorized webhook access attempt");
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const update = await req.json();
        // Initialize bot if not already initialized
        await customerBot.init();
        // Pass the update to Grammy manually
        await customerBot.handleUpdate(update);
        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("Error processing Telegram update:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
