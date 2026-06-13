import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const chatId = process.env.ADMIN_CHAT_ID;

if (!supabaseUrl || !supabaseKey || !chatId) {
    console.error("Missing environment variables in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log(`Setting chat ID ${chatId} as an approved admin...`);

    const { data, error } = await supabase
        .from("telegram_admins")
        .upsert({
            telegram_chat_id: parseInt(chatId),
            username: "Admin",
            role: "admin",
            is_approved: true
        }, { onConflict: "telegram_chat_id" })
        .select();

    if (error) {
        console.error("❌ Failed to add admin to database:", error.message);
    } else {
        console.log("✅ Successfully added you as an admin!");
        console.log("Try sending /dashboard to the Admin bot now.");
    }
}

main();
