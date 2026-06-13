import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ShoppingIntent {
    keywords: string[];
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price_asc' | 'price_desc' | 'newest';
}

export async function extractShoppingIntent(query: string): Promise<ShoppingIntent> {
    const prompt = `
You are an AI assistant for an e-commerce store called KelalShop.
Extract the shopping intent from the user's query and output it as pure JSON matching this interface:
{
    keywords: string[]; // Search terms, e.g., ["gaming", "laptop"]
    category?: string;  // E.g., "electronics", "fashion", etc.
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price_asc' | 'price_desc' | 'newest';
}

User query: "${query}"

Return ONLY the raw JSON string, with no markdown code blocks or additional text.
`;

    try {
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const text = response.text || "{}";
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanedText) as ShoppingIntent;
    } catch (error) {
        console.error("Error extracting shopping intent:", error);
        return { keywords: query.split(" ") };
    }
}

export async function answerCustomerFAQ(question: string): Promise<string> {
    const prompt = `
You are a helpful customer support AI for KelalShop. 
Answer the following customer question briefly and politely. 
If it's about an order status, remind them they can use the /orders or /track commands.

Question: "${question}"
`;

    try {
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text || "I'm sorry, I couldn't process your request.";
    } catch (error) {
        console.error("Error answering FAQ:", error);
        return "I'm sorry, I am currently experiencing technical difficulties.";
    }
}
