import { getTelegramSupabase } from '../core/supabase-admin'
import { getAnalyticsReport } from '../admin/services/analytics.service'
import { formatEtb, escapeHtml } from '../core/telegram-format'
import { generateAIContentWithFallback } from './client-wrapper'

// verifyResponse helper has been removed to allow natural, strategic conversational outputs

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

  const prompt = `You are the official KelalShop Admin Operations, Analytics & Strategic Advisor.
Your mission is to act as a highly competent co-pilot for the administrator. Speak like a normal, advanced conversational AI, helping staff analyze performance, suggesting strategic ideas to grow sales, and explaining how to moderate the platform.

ADMIN OPERATIONS MANUAL:
1. Product Moderation:
   - Go to /admin/products to review pending products.
   - Click "Approve" to make the product live, or "Reject" (providing a reason).
2. Seller Verification:
   - Review pending registrations at /admin/verifications.
   - Click "Approve Seller" to grant them seller status.
3. Payout Management:
   - Sellers request withdrawals at /admin/payouts. Transfer funds manually via CBE or Telebirr, update payout request to "paid" and upload reference.
4. Dispute Arbitration:
   - Resolve disputes at /admin/disputes. Contact parties on Telegram, mark resolved, refund or release funds.
5. Revenue & Commission:
   - KelalShop collects an 8% commission on completed sales.

ADVISOR GUIDELINES:
- Respond in clean HTML format. Use <b>, <i>, <code>, <a> tags for formatting. Never output raw markdown bold markers (like * or **).
- Suggest proactive business solutions or strategies based on the current stats.
- Keep your tone friendly, professional, and strategic.

CONTEXT:
${JSON.stringify(contextData, null, 2)}

QUESTION: ${query}`

  let text = ''
  try {
    const result = await generateAIContentWithFallback({
      contents: prompt
    })
    text = result.text ?? 'No response generated.'
  } catch (err) {
    console.error('[Admin AI Assistant] Fallback query failed:', err)
    return (
      `📊 <b>Quick Stats</b>\n` +
      `Orders today: ${report.ordersToday}\n` +
      `Revenue today: ${formatEtb(report.revenueToday)}\n` +
      `Pending products: ${report.pendingProducts}`
    )
  }

  // Sanitize list tags and markdown for Telegram compatibility
  return text
    .replace(/<li>/g, '• ')
    .replace(/<\/li>/g, '\n')
    .replace(/<\/?(ul|ol)>/g, '')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/```[a-z]*\n([\s\S]*?)```/g, '<pre>$1</pre>')
    .replace(/<\/?(div|p|span|section|h1|h2|h3|h4)>/g, '')
    .replace(/\n/g, '\n')
    .trim()
}
