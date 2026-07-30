import { getTelegramSupabase } from '../core/supabase-admin'
import { getAnalyticsReport } from '../admin/services/analytics.service'
import { formatEtb } from '../core/telegram-format'
import { generateAIContentWithFallback } from './client-wrapper'

const SYSTEM_INSTRUCTION = `
You are the official KelalShop Admin Operations, Analytics & Strategic Advisor.
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
- Suggest proactive business solutions or strategies based on the current stats when analytics are requested.
- Keep your tone friendly, professional, and strategic.
`

export async function handleAdminGeminiQuery(query: string): Promise<string> {
  let text = ''
  
  try {
    const messages = [
      { role: 'user', parts: [{ text: query }] }
    ]

    const response = await generateAIContentWithFallback({
      contents: messages,
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{
        functionDeclarations: [
          {
            name: 'get_analytics_report',
            description: 'Get platform analytics (orders today, revenue today/week/month, pending approvals, pending payments, new users)',
            parameters: { type: 'OBJECT', properties: {} }
          },
          {
            name: 'get_recent_orders',
            description: 'Get the 5 most recent orders placed on the platform',
            parameters: { type: 'OBJECT', properties: {} }
          }
        ]
      }]
    })

    const functionCalls = response.functionCalls
    if (functionCalls && functionCalls.length > 0) {
      const toolParts: any[] = []

      for (const call of functionCalls) {
        const { name } = call
        let result: any = null

        if (name === 'get_analytics_report') {
          result = await getAnalyticsReport()
        } else if (name === 'get_recent_orders') {
          const supabase = getTelegramSupabase()
          const { data: recentOrders } = await supabase
            .from('orders')
            .select('id, amount, status')
            .order('created_at', { ascending: false })
            .limit(5)
          result = (recentOrders ?? []).map((o) => ({
            id: o.id.slice(0, 8),
            amount: Number(o.amount),
            status: o.status,
          }))
        }

        toolParts.push({
          functionResponse: {
            name,
            response: { result }
          }
        })
      }

      // Second turn with tool outputs
      const secondResponse = await generateAIContentWithFallback({
        contents: [
          ...messages,
          {
            role: 'model',
            parts: functionCalls.map((fc: any) => ({
              functionCall: { name: fc.name, args: fc.args }
            }))
          },
          {
            role: 'user',
            parts: toolParts
          }
        ],
        systemInstruction: SYSTEM_INSTRUCTION
      })

      text = secondResponse.text || "I've processed your request."
    } else {
      text = response.text || "No response generated."
    }
  } catch (err) {
    console.error('[Admin AI Assistant] Fallback query failed:', err)
    // Quick fallback metrics query
    try {
      const report = await getAnalyticsReport()
      return (
        `📊 <b>Quick Stats</b>\n` +
        `Orders today: ${report.ordersToday}\n` +
        `Revenue today: ${formatEtb(report.revenueToday)}\n` +
        `Pending products: ${report.pendingProducts}`
      )
    } catch {
      return '🤖 Sorry, I experienced an error processing your query.'
    }
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
    .trim()
}
