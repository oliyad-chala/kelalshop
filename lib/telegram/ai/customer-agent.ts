import { createAdminClient } from '@/lib/supabase/admin'
import { emitTelegramEvent } from '../notifications/templates'
import { generateAIContentWithFallback } from './client-wrapper'
import { sendTelegramProductCards } from '../core/telegram-format'
import { searchCatalogProducts } from '@/lib/utils/product-search'

const SYSTEM_INSTRUCTION = `
You are the official KelalShop AI Shopping & Support Assistant.
KelalShop is an Ethiopian peer-to-peer e-commerce platform.

CRITICAL SEARCH & TOOLS RULES:
- Whenever a customer asks about products, prices, lists, availability, or recommendations (e.g. "CAN I GET PHONE", "give me phone", "Ok give me best price phone list", "show me cheap phones", "do you have shoes?", "what do you sell?"), you MUST query the database first by calling the "search_products" tool.
- If the customer says "give me this", "order this", or refers to an item from a replied-to message, extract the product name or keywords from the [Replying to] context or recent conversation and call "search_products" (or "add_to_cart" if you already have the exact productId UUID). If you aren't sure what "this" refers to, politely ask which product they want and offer to search.
- NEVER make up, guess, or hallucinate product names, prices, or specifications. Only recommend products returned in the "available" array from "search_products".
- If "available" is empty and "soldOutMatches" has items, let the user know matching items are currently sold out and invite them to click the "🛒 Open Checkout Mini App" button below to browse other items or post a request on KelalShop.
- If both "available" and "soldOutMatches" are empty, tell the user no matching products are currently listed and suggest tapping "🛒 Open Checkout Mini App" below.
- CRITICAL: Present up to 3 available product options cleanly. Product photo cards with direct View/Shop links are sent right after your message, so keep your summary short and friendly.
- If a cart or order tool returns "linked_account_required", never mention internal error codes — let them know they can buy directly using the "🛒 View" or "🛒 Open Checkout Mini App" buttons below, or link their account anytime using /link.

CRITICAL LANGUAGE RULE:
- You must respond ONLY in clean, friendly English. Do NOT respond in Amharic under any circumstances. If the user greets or queries you in Amharic (or any language other than English), politely reply and assist them strictly in English.

- Prices on KelalShop are ALWAYS in ETB (Ethiopian Birr), never USD ($) or INR (₹). Always format prices like "50,000 ETB".

IMPORTANT FORMATTING RULES:
- Respond ONLY with plain text and Telegram-supported inline HTML tags: <b>, <i>, <code>, <a>.
- NEVER output <!DOCTYPE>, <html>, <head>, <body>, <h1>, <p>, <br>, <ul>, <li>, <button>, markdown asterisks (**), or markdown code blocks (\`\`\`). Use standard newlines instead.

KELALSHOP KNOWLEDGE BASE FAQ:
1. What is KelalShop? It is a marketplace connecting buyers with local shoppers/sellers in Ethiopia.
2. How do I buy? Find products, add them to your cart, and checkout.
3. Payment: Payments are settled peer-to-peer (P2P) directly between buyer and shopper. You can pay via Telebirr, CBE transfer, or cash on delivery once terms are agreed. KelalShop does NOT process payments on the site.
4. Delivery: Coordinated directly between buyer and shopper. Usually local delivery is arranged via ride/motorcycle.
5. Seller Commission: KelalShop charges a small commission (8%) to sellers on completed orders.
6. Seller Registration: Sellers must register on the website (kelalshop.com) by clicking "Become a Shopper" and entering their details including phone number.
7. Support: If a customer has an issue and wants to talk to a human support agent/staff member, politely instruct them to click the "💬 Support Ticket" button in the menu below.

If the query is completely unrelated to shopping or KelalShop (e.g. general trivia), politely reply that you are a shopping assistant and guide them back to KelalShop.
`

// In-memory conversation state cache
const sessionHistory = new Map<number, any[]>()

function getSessionHistory(chatId: number): any[] {
  if (!sessionHistory.has(chatId)) {
    sessionHistory.set(chatId, [])
  }
  return sessionHistory.get(chatId)!
}

/** Ensures history never begins mid-tool-call when trimming old messages. */
function trimSessionHistory(history: any[], maxLength = 20): void {
  if (history.length <= maxLength) return
  let dropCount = history.length - maxLength
  while (dropCount < history.length) {
    const turn = history[dropCount]
    const isPlainUserText = turn?.role === 'user' && Array.isArray(turn?.parts) && turn.parts.some((p: any) => typeof p.text === 'string')
    if (isPlainUserText) break
    dropCount++
  }
  history.splice(0, dropCount)
}

export async function handleCustomerAIQuery(ctx: any): Promise<void> {
  const chatId = ctx.chat?.id
  const text = ctx.message?.text
  if (!chatId || !text) return

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kelalshop.com'
  await ctx.replyWithChatAction('typing')

  const admin = createAdminClient()

  // 1. Check if the user is linked
  const { data: tgUser } = await admin
    .from('telegram_users')
    .select('profile_id, is_verified')
    .eq('chat_id', chatId)
    .maybeSingle()

  const profileId = (tgUser?.is_verified && tgUser?.profile_id) ? tgUser.profile_id : null

  // 2. Fetch and safely trim conversation history
  const history = getSessionHistory(chatId)
  trimSessionHistory(history, 20)

  const replyTo = ctx.message?.reply_to_message
  const replyContext = (replyTo?.caption || replyTo?.text || '').trim()
  const enrichedUserText = replyContext
    ? `[Replying to message: "${replyContext.slice(0, 400)}"]\n\nCustomer says: ${text}`
    : text

  const turnStartIndex = history.length
  history.push({ role: 'user', parts: [{ text: enrichedUserText }] })

  try {
    // Call AI with fallback
    const response = await generateAIContentWithFallback({
      contents: history.map((h) => ({
        role: h.role,
        parts: h.parts,
      })),
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{
        functionDeclarations: [
          {
            name: 'search_products',
            description: 'Search for available products on KelalShop',
            parameters: {
              type: 'OBJECT',
              properties: {
                query: { type: 'STRING', description: 'Search term/keyword' },
                category: { type: 'STRING', description: 'Optional category' },
                minPrice: { type: 'NUMBER', description: 'Minimum price filter' },
                maxPrice: { type: 'NUMBER', description: 'Maximum price filter' },
                sortBy: { type: 'STRING', description: 'Sort order: price_asc (cheapest first), price_desc (most expensive first), newest' }
              },
              required: ['query']
            }
          },
          {
            name: 'get_cart',
            description: 'Get current cart items for the customer',
            parameters: { type: 'OBJECT', properties: {} }
          },
          {
            name: 'add_to_cart',
            description: 'Add a product to the cart',
            parameters: {
              type: 'OBJECT',
              properties: {
                productId: { type: 'STRING', description: 'The UUID of the product' },
                quantity: { type: 'NUMBER', description: 'Quantity to add' }
              },
              required: ['productId', 'quantity']
            }
          },
          {
            name: 'remove_from_cart',
            description: 'Remove a product from the cart',
            parameters: {
              type: 'OBJECT',
              properties: {
                productId: { type: 'STRING', description: 'The UUID of the product' }
              },
              required: ['productId']
            }
          },
          {
            name: 'get_orders',
            description: 'Retrieve recent orders placed by this customer',
            parameters: { type: 'OBJECT', properties: {} }
          }
        ]
      }]
    })

    const functionCalls = response.functionCalls
    if (functionCalls && functionCalls.length > 0) {
      // Process function calls
      const toolParts: any[] = []
      let showMiniAppButton = false
      let foundProducts: any[] = []

      for (const call of functionCalls) {
        const { name, args } = call
        let result: any = null

        if (name === 'search_products') {
          const sArgs = (args || {}) as any
          const searchResult = await searchProductsTool(sArgs, profileId)
          result = searchResult
          if (searchResult.available.length > 0) {
            foundProducts = searchResult.available
          }
          // Always show Mini App button on product search turns (whether results found or empty)
          showMiniAppButton = true
        } else if (name === 'get_cart') {
          result = await getCartTool(profileId)
          showMiniAppButton = true
        } else if (name === 'add_to_cart') {
          const aArgs = (args || {}) as any
          result = await addToCartTool(aArgs.productId, aArgs.quantity ?? 1, profileId)
          if (result.success || result.error === 'linked_account_required') {
            showMiniAppButton = true
          }
        } else if (name === 'remove_from_cart') {
          const rArgs = (args || {}) as any
          result = await removeFromCartTool(rArgs.productId, profileId)
        } else if (name === 'get_orders') {
          result = await getOrdersTool(profileId)
        }

        toolParts.push({
          functionResponse: {
            name,
            response: { result }
          }
        })
      }

      // Add model's tool request and tool results to history
      history.push({
        role: 'model',
        parts: functionCalls.map((fc: any) => ({
          functionCall: {
            name: fc.name,
            args: fc.args
          }
        }))
      })
      history.push({
        role: 'user',
        parts: toolParts
      })

      // Request second turn from AI after sending tool outputs
      const secondResponse = await generateAIContentWithFallback({
        contents: history.map((h) => ({
          role: h.role,
          parts: h.parts,
        })),
        systemInstruction: SYSTEM_INSTRUCTION
      })

      let finalMessage = sanitizeHtmlFormatting(secondResponse.text || '')
      if (!finalMessage) {
        finalMessage = foundProducts.length > 0
          ? 'Here are the matching products I found on KelalShop:'
          : 'Check out the Mini App below to explore available products on KelalShop!'
      }

      // Save final model response
      history.push({ role: 'model', parts: [{ text: finalMessage }] })

      // Send summary message with Checkout Mini App button
      const replyButtons = showMiniAppButton
        ? [{ text: '🛒 Open Checkout Mini App', web_app: { url: `${BASE_URL}/telegram/checkout` } }]
        : []
      const keyboard = replyButtons.length > 0 ? { inline_keyboard: [replyButtons] } : undefined
      await safeReply(ctx, finalMessage, { reply_markup: keyboard })

      // Send product cards with images and Buy/View links
      if (foundProducts.length > 0) {
        await sendTelegramProductCards(ctx, foundProducts, BASE_URL)
      }
    } else {
      let finalMessage = sanitizeHtmlFormatting(response.text || '') || "Sorry, I didn't catch that."

      // Save model response
      history.push({ role: 'model', parts: [{ text: finalMessage }] })

      await safeReply(ctx, finalMessage)
    }
  } catch (err: any) {
    // Roll back incomplete turn so conversation history never stays corrupted
    history.length = turnStartIndex
    console.error('[handleCustomerAIQuery] Gemini error:', err)
    await safeReply(ctx, '🤖 Sorry, I experienced an error processing your query. Please try again.')
  }
}

async function safeReply(ctx: any, text: string, options: any = {}) {
  try {
    return await ctx.reply(text, { ...options, parse_mode: 'HTML' })
  } catch (err: any) {
    const errMsg = err.message || err.description || ''
    if (errMsg.includes("can't parse entities") || errMsg.includes("parse_mode")) {
      console.warn('[safeReply] HTML parsing failed, falling back to plain text. Original text:', text, 'Error:', errMsg)
      const plainText = text.replace(/<[^>]*>/g, '')
      return await ctx.reply(plainText, { ...options, parse_mode: undefined })
    }
    throw err
  }
}

function sanitizeHtmlFormatting(text: string): string {
  if (!text) return ''

  // Strip document/boilerplate wrapper blocks if an LLM emits full HTML pages
  let cleaned = text
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')

  // 1. Convert any variant of <br> to newline
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n')

  // 2. Convert <li> to list bullets and </li> to newlines
  cleaned = cleaned.replace(/<li>/gi, '• ').replace(/<\/li>/gi, '\n')

  // 3. Remove <ul> and <ol> tags
  cleaned = cleaned.replace(/<\/?(ul|ol)>/gi, '')

  // 4. Convert <p> and </p> tags
  cleaned = cleaned.replace(/<p>/gi, '').replace(/<\/p>/gi, '\n\n')

  // 5. Convert markdown bold/italic/code to HTML format if they creep in
  cleaned = cleaned
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/```[a-z]*\n([\s\S]*?)```/g, '<pre>$1</pre>')

  // 6. Strip any HTML tags that are not explicitly allowed in Telegram HTML parse mode.
  // Allowed tags list: b, strong, i, em, u, ins, s, strike, del, span, a, code, pre, blockquote
  const allowedTags = new Set([
    'b', '/b', 'strong', '/strong',
    'i', '/i', 'em', '/em',
    'u', '/u', 'ins', '/ins',
    's', '/s', 'strike', '/strike', 'del', '/del',
    'span', '/span',
    'a', '/a',
    'code', '/code',
    'pre', '/pre',
    'blockquote', '/blockquote'
  ])

  cleaned = cleaned.replace(/<(\/?[a-z0-9_-]+)(?:\s+[^>]*?)?>/gi, (match, tagName) => {
    const lowerTag = tagName.toLowerCase()
    if (allowedTags.has(lowerTag)) {
      // For 'a' tag, preserve ONLY the 'href' attribute
      if (lowerTag.startsWith('a')) {
        if (lowerTag === 'a') {
          const hrefMatch = match.match(/\bhref="([^"]*)"/i) || match.match(/\bhref='([^']*)'/i)
          return hrefMatch ? `<a href="${hrefMatch[1]}">` : '<a>'
        }
        return '</a>'
      }
      // For all other allowed tags, strip any attributes to prevent entity parsing errors
      return `<${tagName}>`
    }
    // For unsupported tags, strip the tag entirely but keep inner text
    return ''
  })

  return cleaned.trim()
}

// --- Tool Implementations ---

async function searchProductsTool(
  args: { query?: string; category?: string; minPrice?: number; maxPrice?: number; sortBy?: 'price_asc' | 'price_desc' | 'newest' },
  profileId: string | null
) {
  const admin = createAdminClient()
  const { available, soldOut } = await searchCatalogProducts(admin, {
    query: args?.query ?? '',
    category: args?.category,
    minPrice: args?.minPrice,
    maxPrice: args?.maxPrice,
    sortBy: args?.sortBy,
    limit: 3,
  })

  // Log in search_logs cleanly so analytics issues never block product search
  try {
    await admin.from('search_logs').insert({
      query: (args?.query || args?.category || 'browse').slice(0, 200),
      results_count: available.length,
      user_id: profileId,
    })
  } catch (err) {
    console.warn('[searchProductsTool] Failed to write search_logs:', err)
  }

  return {
    available,
    soldOutMatches: soldOut,
  }
}

async function getCartTool(profileId: string | null) {
  if (!profileId) {
    return { error: 'linked_account_required' }
  }
  const admin = createAdminClient()
  const { data: items } = await admin
    .from('cart_items')
    .select('*, product:product_id(name, price)')
    .eq('user_id', profileId)

  return (items || []).map((i: any) => ({
    productId: i.product_id,
    name: i.product?.name || 'Unknown Product',
    price: Number(i.product?.price || 0),
    quantity: i.quantity,
  }))
}

async function addToCartTool(productId: string, quantity: number, profileId: string | null) {
  if (!profileId) {
    return { error: 'linked_account_required' }
  }
  const admin = createAdminClient()
  const { data: product } = await admin.from('products').select('id, name, shopper_id').eq('id', productId).maybeSingle()
  if (!product) {
    return { error: 'product_not_found' }
  }
  if (product.shopper_id === profileId) {
    return { error: 'cannot_buy_own_product' }
  }

  const { data: existing } = await admin
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', profileId)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    const newQty = existing.quantity + quantity
    await admin.from('cart_items').update({ quantity: newQty }).eq('id', existing.id)
  } else {
    await admin.from('cart_items').insert({ user_id: profileId, product_id: productId, quantity })
  }

  return { success: true, productName: product.name }
}

async function removeFromCartTool(productId: string, profileId: string | null) {
  if (!profileId) {
    return { error: 'linked_account_required' }
  }
  const admin = createAdminClient()
  await admin.from('cart_items').delete().eq('user_id', profileId).eq('product_id', productId)
  return { success: true }
}

async function getOrdersTool(profileId: string | null) {
  if (!profileId) {
    return { error: 'linked_account_required' }
  }
  const admin = createAdminClient()
  const { data: orders } = await admin
    .from('orders')
    .select('id, amount, status, created_at, product:product_id(name)')
    .eq('buyer_id', profileId)
    .order('created_at', { ascending: false })
    .limit(5)

  return (orders || []).map((o: any) => ({
    id: o.id.slice(0, 8),
    productName: o.product?.name || 'Unknown Product',
    amount: Number(o.amount),
    status: o.status,
    date: o.created_at,
  }))
}

async function createSupportTicketTool(description: string, profileId: string | null, chatId: number) {
  const admin = createAdminClient()
  
  const { data: session, error } = await admin
    .from('support_sessions')
    .insert({
      user_id: profileId,
      guest_id: chatId.toString(),
      status: 'human',
    } as any)
    .select('id')
    .single()

  if (error || !session) {
    return { error: 'failed_to_create_session' }
  }

  await admin.from('support_messages').insert({
    session_id: session.id,
    sender_type: 'user',
    content: description,
  })

  // Notify Admin Bot
  await emitTelegramEvent('admin', 'SUPPORT_TICKET', {
    ticketId: session.id,
    customerDetails: `Telegram Chat ID: ${chatId}`,
    reason: 'Created via AI Shopping Assistant',
    summary: description,
  })

  return { success: true, ticketId: session.id.slice(0, 8) }
}
