import { Bot, Context, session, SessionFlavor } from "grammy";

// Define the shape of our session
export interface SessionData {
    state: "IDLE" | "AWAITING_EMAIL" | "AWAITING_OTP";
    email?: string;
    otpAttempts: number;
}

// Add session flavor to our context type
export type CustomerContext = Context & SessionFlavor<SessionData> & {
    user?: any; // The telegram_users record if linked
};

if (!process.env.TELEGRAM_CUSTOMER_BOT_TOKEN) {
    throw new Error("TELEGRAM_CUSTOMER_BOT_TOKEN is not defined in environment variables");
}

export const customerBot = new Bot<CustomerContext>(process.env.TELEGRAM_CUSTOMER_BOT_TOKEN);

// Install session middleware
customerBot.use(session({
    initial(): SessionData {
        return { state: "IDLE", otpAttempts: 0 };
    },
}));
