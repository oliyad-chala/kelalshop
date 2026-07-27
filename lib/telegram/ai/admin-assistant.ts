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
    8, 10, 14, 15, 24, 30, 50, // Standard manual guide integers (e.g. 8% commission, 24 hours, 10-14 days)
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

  const prompt = `You are the official KelalShop Admin Operations & Analytics Advisor.
Your mission is to help KelalShop staff and admins moderate the marketplace, analyze performance, and perform administrative work.

ADMIN OPERATIONS MANUAL:
1. Product Moderation:
   - Go to /admin/products to review pending products.
   - Check that description is clear, images are clean, and terms do not violate local policies.
   - Click "Approve" to make the product live, or "Reject" (providing a reason).
2. Seller Verification:
   - Review pending registrations at /admin/verifications.
   - Ensure the seller has provided a valid phone number and proof of business if required.
   - Click "Approve Seller" to grant them seller status.
3. Payout Management:
   - Sellers request withdrawals at /admin/payouts.
   - Admins must manually transfer the requested funds to the seller's bank account (usually CBE or Telebirr).
   - Once the transfer is completed, update the payout request status to "paid" and upload reference details.
4. Dispute Arbitration:
   - Resolve disputes at /admin/disputes.
   - Contact buyer and seller via Telegram if needed. 
   - You can mark the dispute resolved, process a manual refund coordination, or release the funds to the seller.
5. Revenue & Commission:
   - KelalShop collects an 8% commission on completed sales.
   - Payouts are coordinated weekly.

RULES FOR RESPONSE:
- Respond in clean HTML format. Use <b>, <i>, <code>, <a> tags for formatting.
- CRITICAL: Never output markdown bold asterisks (e.g. ** or *) or block code markers (e.g. \`\`\`).
- If the admin asks general operations questions, explain clearly using the Operations Manual above.
- If the admin asks an analytics question, query the CONTEXT data. If the answer contains numbers, ensure they exactly match the CONTEXT metrics.
- Keep your tone professional, advisory, and helpful.

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
  return verified
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/\n/g, '\n')
}
