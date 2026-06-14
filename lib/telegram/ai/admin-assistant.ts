import { GoogleGenAI } from '@google/genai'
import { getTelegramSupabase } from '../core/supabase-admin'
import { getAnalyticsReport } from '../admin/services/analytics.service'
import { formatEtb, escapeHtml } from '../core/telegram-format'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

function extractNumbers(text: string): number[] {
  return (text.match(/[\d,]+(?:\.\d+)?/g) ?? []).map((n) => parseFloat(n.replace(/,/g, '')))
}

function verifyResponse(response: string, allowedNumbers: number[]): string {
  const mentioned = extractNumbers(response)
  const allowedSet = new Set(allowedNumbers.map((n) => Math.round(n)))
  for (const n of mentioned) {
    const rounded = Math.round(n)
    if (rounded > 0 && !allowedSet.has(rounded)) {
      return (
        'I only have limited verified data for your question. ' +
        'Please use /analytics or /dashboard for accurate numbers.'
      )
    }
  }
  return response.replace(/\*\*/g, '').replace(/\*/g, '')
}

export async function handleAdminGeminiQuery(query: string): Promise<string> {
  const supabase = getTelegramSupabase()
  const report = await getAnalyticsReport()

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, amount, status')
    .order('created_at', { ascending: false })
    .limit(5)

  const contextData = {
    date: new Date().toISOString(),
    ordersToday: report.ordersToday,
    revenueToday: report.revenueToday,
    revenueWeek: report.revenueWeek,
    revenueMonth: report.revenueMonth,
    pendingProducts: report.pendingProducts,
    pendingPayments: report.pendingPayments,
    newUsersToday: report.newUsersToday,
    topSellers: report.topSellers,
    recentOrders: (recentOrders ?? []).map((o) => ({
      id: o.id.slice(0, 8),
      amount: Number(o.amount),
      status: o.status,
    })),
  }

  const allowedNumbers = [
    report.ordersToday,
    report.revenueToday,
    report.revenueWeek,
    report.revenueMonth,
    report.pendingProducts,
    report.pendingPayments,
    report.newUsersToday,
    report.newUsersWeek,
    ...report.topSellers.map((s) => s.revenue),
    ...(recentOrders ?? []).map((o) => Number(o.amount)),
  ]

  const prompt = `You are KelalShop admin AI. Answer ONLY using CONTEXT below.
If data is insufficient, say you don't have that data — do NOT invent numbers.
Use plain text with line breaks. No markdown asterisks.
Format currency as X ETB.

CONTEXT:
${JSON.stringify(contextData, null, 2)}

QUESTION: ${query}`

  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000))

  const generation = ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  })

  const result = await Promise.race([generation, timeout])
  if (!result) {
    return (
      `📊 <b>Quick Stats</b>\n` +
      `Orders today: ${report.ordersToday}\n` +
      `Revenue today: ${formatEtb(report.revenueToday)}\n` +
      `Pending products: ${report.pendingProducts}`
    )
  }

  const text = (result as { text?: string }).text ?? 'No response generated.'
  const verified = verifyResponse(text, allowedNumbers)
  return verified.replace(/\n/g, '\n')
}
