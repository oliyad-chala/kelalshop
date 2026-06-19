import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, otp } = body;

        if (!email || !otp) {
            return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
        }

        await sendOtpEmail(email, otp);

        return NextResponse.json({ success: true, message: "OTP sent via email" });
    } catch (error) {
        console.error("Error sending OTP email:", error);
        return NextResponse.json({ error: "Failed to send OTP email" }, { status: 500 });
    }
}
