import { getTelegramSupabase } from '../core/supabase-admin'
import { formatEtb, escapeHtml, truncateId } from '../core/telegram-format'

export const NotificationTemplates = {
  newOrder: (orderId: string, amount: number) =>
    `🛍️ <b>New Order Placed!</b>\nOrder: <code>${truncateId(orderId)}</code>\nAmount: <b>${formatEtb(amount)}</b>`,

  newSeller: (storeName: string) =>
    `🏪 <b>New Seller Registered</b>\nStore: <b>${escapeHtml(storeName)}</b>\nPending approval.`,

  productPending: (productName: string) =>
    `📦 <b>Product Pending Approval</b>\nProduct: <b>${escapeHtml(productName)}</b>`,

  productApproved: (productName: string) =>
    `✅ <b>Product Approved</b>\nProduct: <b>${escapeHtml(productName)}</b> is now live.`,

  productRejected: (productName: string, reason?: string) =>
    `❌ <b>Product Rejected</b>\nProduct: <b>${escapeHtml(productName)}</b>\nReason: ${escapeHtml(reason || 'Not specified')}`,

  paymentRequest: (sellerName: string, amount: number) =>
    `💸 <b>Payment Request</b>\nSeller: <b>${escapeHtml(sellerName)}</b>\nAmount: <b>${formatEtb(amount)}</b>`,

  supportTicket: (ticketId: string, subject: string) =>
    `🎫 <b>New Support Ticket</b>\nTicket: <code>${truncateId(ticketId)}</code>\nSubject: <b>${escapeHtml(subject)}</b>`,

  suspiciousActivity: (userId: string, description: string) =>
    `🚨 <b>Suspicious Activity</b>\nUser: <code>${truncateId(userId)}</code>\nDetails: <b>${escapeHtml(description)}</b>`,
}

export type AdminNotificationEvent =
  | 'NEW_ORDER'
  | 'NEW_SELLER'
  | 'PRODUCT_PENDING'
  | 'PRODUCT_APPROVED'
  | 'PRODUCT_REJECTED'
  | 'PAYMENT_REQUEST'
  | 'WITHDRAWAL_REQUEST'
  | 'SUPPORT_TICKET'
  | 'SUSPICIOUS_ACTIVITY'

export type CustomerNotificationEvent =
  | 'ORDER_ACCEPTED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'ORDER_PLACED'
  | 'FLASH_SALE'
  | 'TICKET_REPLY'
  | 'BROADCAST'

export function buildAdminMessage(event: AdminNotificationEvent, payload: Record<string, unknown>): string {
  switch (event) {
    case 'NEW_ORDER':
      return NotificationTemplates.newOrder(String(payload.orderId), Number(payload.amount))
    case 'NEW_SELLER':
      return NotificationTemplates.newSeller(String(payload.storeName))
    case 'PRODUCT_PENDING':
      return NotificationTemplates.productPending(String(payload.productName))
    case 'PRODUCT_APPROVED':
      return NotificationTemplates.productApproved(String(payload.productName))
    case 'PRODUCT_REJECTED':
      return NotificationTemplates.productRejected(String(payload.productName), payload.reason as string | undefined)
    case 'PAYMENT_REQUEST':
    case 'WITHDRAWAL_REQUEST':
      return NotificationTemplates.paymentRequest(String(payload.sellerName), Number(payload.amount))
    case 'SUPPORT_TICKET':
      return NotificationTemplates.supportTicket(String(payload.ticketId), String(payload.subject))
    case 'SUSPICIOUS_ACTIVITY':
      return NotificationTemplates.suspiciousActivity(String(payload.userId), String(payload.description))
    default:
      return `📢 <b>Notification</b>\n${escapeHtml(JSON.stringify(payload))}`
  }
}

export function buildCustomerMessage(event: CustomerNotificationEvent, payload: Record<string, unknown>): string {
  const orderId = payload.orderId ? truncateId(String(payload.orderId)) : '????'
  switch (event) {
    case 'ORDER_PLACED':
      return `✅ <b>Order placed!</b>\nOrder #${orderId}\nAmount: <b>${formatEtb(Number(payload.amount || 0))}</b>`
    case 'ORDER_ACCEPTED':
      return `✅ <b>Order #${orderId} accepted!</b>\nThe seller is preparing your order.`
    case 'ORDER_SHIPPED':
      return `🚚 <b>Order #${orderId} shipped!</b>\nYour package is on the way.`
    case 'ORDER_DELIVERED':
      return `📦 <b>Order #${orderId} delivered!</b>\nThank you for shopping with KelalShop!`
    case 'ORDER_CANCELLED':
      return `❌ <b>Order #${orderId} cancelled.</b>`
    case 'FLASH_SALE':
      return `⚡ <b>Flash sale is live!</b>\nUse /deals to browse.`
    case 'TICKET_REPLY':
      return `🎫 <b>Support reply on ticket #${truncateId(String(payload.ticketId))}:</b>\n\n${escapeHtml(String(payload.message || ''))}`
    default:
      return `📢 <b>Update</b>\n${escapeHtml(String(payload.message || 'You have a new notification.'))}`
  }
}

export async function enqueueNotification(params: {
  channel: 'admin' | 'customer'
  eventType: string
  payload: Record<string, unknown>
  idempotencyKey?: string
  targetProfileId?: string
}) {
  const supabase = getTelegramSupabase()
  const row = {
    channel: params.channel,
    event_type: params.eventType,
    payload: {
      ...params.payload,
      ...(params.targetProfileId ? { targetProfileId: params.targetProfileId } : {}),
    },
    status: 'pending',
    scheduled_at: new Date().toISOString(),
    idempotency_key: params.idempotencyKey ?? null,
  }

  const { error } = await supabase.from('telegram_notification_queue').insert(row)
  if (error && !error.message.includes('duplicate')) {
    console.error('[enqueueNotification]', error.message)
  }
}

/** Fire-and-forget from server actions */
export function emitTelegramEvent(
  channel: 'admin' | 'customer',
  eventType: string,
  payload: Record<string, unknown>,
  options?: { idempotencyKey?: string; targetProfileId?: string }
) {
  enqueueNotification({
    channel,
    eventType,
    payload,
    idempotencyKey: options?.idempotencyKey,
    targetProfileId: options?.targetProfileId,
  }).catch(() => {})
}
