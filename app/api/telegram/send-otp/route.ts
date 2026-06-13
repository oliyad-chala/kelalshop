import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, otp } = body;

        if (!email || !otp) {
            return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
        }

        // Mock sending email
        console.log(`\n\n========================================`);
        console.log(`📧 MOCK EMAIL TO: ${email}`);
        console.log(`🔐 SUBJECT: Your KelalShop Telegram Link Code`);
        console.log(`Your code is: ${otp}`);
        console.log(`========================================\n\n`);

        return NextResponse.json({ success: true, message: "OTP logged to console" });
    } catch (error) {
        console.error("Error sending OTP:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
