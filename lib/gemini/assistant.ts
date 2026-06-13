import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function handleGeminiQuery(query: string, isAdmin: boolean): Promise<string> {
    if (!isAdmin) {
        // Public User Prompt
        const prompt = `
You are a friendly customer support AI for KelalShop, an ecommerce platform.
The user asking you a question is a public buyer or seller. 
Answer their query politely and helpfully. Do not reveal any confidential store data. 
Format your response using Markdown.

User Query: ${query}
`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text || "I could not generate a response.";
    }

    // --- Admin User Logic Below ---
    // 1. Fetch some general context to feed to Gemini
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
        { data: ordersData },
        { count: usersCount },
        { data: sellersData },
        { count: pendingProducts }
    ] = await Promise.all([
        supabase.from("orders").select("id, total_amount, status").gte("created_at", today.toISOString()),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("shopper_profiles").select("id, business_name, verification_status"),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("is_available", false)
    ]);

    const totalRevenue = (ordersData || [])
        .filter(o => o.status === "delivered" || o.status === "paid")
        .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const contextData = {
        date: new Date().toISOString(),
        todayOrdersCount: ordersData?.length || 0,
        todayRevenue: totalRevenue,
        totalUsers: usersCount || 0,
        pendingProducts: pendingProducts || 0,
        sellers: sellersData || []
    };

    const prompt = `
You are an AI assistant for the KelalShop ecommerce platform admins.
Answer the following query using ONLY the provided context data. If the context data doesn't contain the answer, say you don't have enough real-time data to answer that yet.
Format your response using Markdown (bolding, lists, etc.) so it looks good in Telegram.

Context Data:
${JSON.stringify(contextData, null, 2)}

User Query: ${query}
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    return response.text || "I could not generate a response.";
}
