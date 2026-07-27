import { GoogleGenAI } from '@google/genai'
import { createAdminClient } from '@/lib/supabase/admin'
import { emitTelegramEvent } from '../notifications/templates'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

const SYSTEM_INSTRUCTION = `
You are the official KelalShop AI Shopping & Support Assistant.
KelalShop is an Ethiopian peer-to-peer e-commerce platform.

IMPORTANT FORMATTING RULES:
- Respond in clean HTML format. Use <b>, <i>, <code>, <a> tags for formatting.
- CRITICAL: Never output markdown like asterisks (e.g. **, *), underscores (_), or markdown code blocks (e.g. \`\`\`). Telegram's HTML parser will crash or display errors if you output markdown. Output ONLY valid HTML tags or plain text.
- If you want to make text bold, use <b>text</b> instead of **text**.
- Keep responses concise and scannable.

BILINGUAL RULES:
- You must always detect and match the customer's language. If they greet or ask in Amharic, reply in Amharic. If they ask in English, reply in English.
- Support both English and Amharic queries.

KELALSHOP KNOWLEDGE BASE FAQ:
1. What is KelalShop? It is a marketplace connecting buyers with local shoppers/sellers in Ethiopia.
2. How do I buy? Find products, add them to your cart, and checkout.
3. Payment: Payments are settled peer-to-peer (P2P) directly between buyer and shopper. You can pay via Telebirr, CBE transfer, or cash on delivery once terms are agreed. KelalShop does NOT process payments on the site.
4. Delivery: Coordinated directly between buyer and shopper. Usually local delivery is arranged via ride/motorcycle.
5. Seller Commission: KelalShop charges a small commission (8%) to sellers on completed orders.
6. Seller Registration: Sellers must register on the website (kelalshop.com) by clicking "Become a Seller" and entering their details including phone number.
7. Support: If a customer has an issue, they can ask you to create a support ticket.

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

export async function handleCustomerAIQuery(ctx: any): Promise<void> {
  const chatId = ctx.chat?.id
  const text = ctx.message?.text
  if (!chatId || !text) return

  await ctx.replyWithChatAction('typing')

  const admin = createAdminClient()

  // 1. Check if the user is linked
  const { data: tgUser } = await admin
    .from('telegram_users')
    .select('profile_id, is_verified')
    .eq('chat_id', chatId)
    .maybeSingle()

  const profileId = (tgUser?.is_verified && tgUser?.profile_id) ? tgUser.profile_id : null

  // 2. Fetch or initialize conversation history
  const history = getSessionHistory(chatId)
  
  // Keep history size in check
  if (history.length > 20) {
    history.splice(0, 4)
  }

  history.push({ role: 'user', parts: [{ text }] })

  try {
    // Call Gemini with tools
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: history.map((h) => ({
        role: h.role,
        parts: h.parts,
      })),
      config: {
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
                  maxPrice: { type: 'NUMBER', description: 'Maximum price filter' }
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
            },
            {
              name: 'create_support_ticket',
              description: 'Create a support ticket for help from a human staff member',
              parameters: {
                type: 'OBJECT',
                properties: {
                  description: { type: 'STRING', description: 'Summary of the issue or dispute' }
                },
                required: ['description']
              }
            }
          ]
        }]
      }
    })

    const functionCalls = response.functionCalls
    if (functionCalls && functionCalls.length > 0) {
      // Process function calls
      const toolParts: any[] = []
      const replyButtons: any[] = []

      for (const call of functionCalls) {
        const { name, args } = call
        let result: any = null

        if (name === 'search_products') {
          const sArgs = args as any
          const products = await searchProductsTool(sArgs, profileId)
          result = products
          
          // Formulate checkout quick actions if products were returned
          if (products.length > 0) {
            replyButtons.push({ text: '🛒 Open Checkout Mini App', web_app: { url: 'https://kelalshop.com/telegram/checkout' } })
          }
        } else if (name === 'get_cart') {
          result = await getCartTool(profileId)
          replyButtons.push({ text: '🛒 Open Checkout Mini App', web_app: { url: 'https://kelalshop.com/telegram/checkout' } })
        } else if (name === 'add_to_cart') {
          const aArgs = args as any
          result = await addToCartTool(aArgs.productId, aArgs.quantity, profileId)
          if (result.success) {
            replyButtons.push({ text: '🛒 Open Checkout Mini App', web_app: { url: 'https://kelalshop.com/telegram/checkout' } })
          }
        } else if (name === 'remove_from_cart') {
          const rArgs = args as any
          result = await removeFromCartTool(rArgs.productId, profileId)
        } else if (name === 'get_orders') {
          result = await getOrdersTool(profileId)
        } else if (name === 'create_support_ticket') {
          const tArgs = args as any
          result = await createSupportTicketTool(tArgs.description, profileId, chatId)
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
        parts: [{ functionCalls }]
      })
      history.push({
        role: 'user',
        parts: toolParts
      })

      // Request second turn from Gemini after sending tool outputs
      const secondResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: history.map((h) => ({
          role: h.role,
          parts: h.parts,
        })),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION
        }
      })

      let finalMessage = secondResponse.text || "I've processed your request."
      finalMessage = sanitizeHtmlFormatting(finalMessage)
      
      // Save final model response
      history.push({ role: 'model', parts: [{ text: finalMessage }] })

      // Send to user
      const keyboard = replyButtons.length > 0 ? { inline_keyboard: [replyButtons] } : undefined
      await ctx.reply(finalMessage, { parse_mode: 'HTML', reply_markup: keyboard })
    } else {
      let finalMessage = response.text || "Sorry, I didn't catch that."
      finalMessage = sanitizeHtmlFormatting(finalMessage)

      // Save model response
      history.push({ role: 'model', parts: [{ text: finalMessage }] })

      await ctx.reply(finalMessage, { parse_mode: 'HTML' })
    }
  } catch (err: any) {
    console.error('[handleCustomerAIQuery] Gemini error:', err)
    await ctx.reply('🤖 Sorry, I experienced an error processing your query. Please try again.', { parse_mode: 'HTML' })
  }
}

function sanitizeHtmlFormatting(text: string): string {
  // Strip out any markdown wrappers like ** or * or ```
  return text
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Convert **bold** to <b>bold</b>
    .replace(/\*(.*?)\*/g, '<i>$1</i>')     // Convert *italic* to <i>italic</i>
    .replace(/`(.*?)`/g, '<code>$1</code>') // Convert `code` to <code>code</code>
    .replace(/```[a-z]*\n([\s\S]*?)```/g, '<pre>$1</pre>') // Convert block code
    .replace(/<\/?(div|p|span|section|h1|h2|h3|h4)>/g, '') // Strip unsupported tags
}

// --- Tool Implementations ---

async function searchProductsTool(args: { query: string; category?: string; minPrice?: number; maxPrice?: number }, profileId: string | null) {
  const admin = createAdminClient()
  let dbQuery = admin
    .from('products')
    .select('*, product_images(*)')
    .eq('is_available', true)
    .ilike('name', `%${args.query}%`)

  if (args.category) {
    dbQuery = dbQuery.ilike('category', `%${args.category}%`)
  }
  if (args.minPrice) {
    dbQuery = dbQuery.gte('price', args.minPrice)
  }
  if (args.maxPrice) {
    dbQuery = dbQuery.lte('price', args.maxPrice)
  }

  const { data, error } = await dbQuery.limit(5)
  const results = data || []

  // Log in search_logs
  await admin.from('search_logs').insert({
    query: args.query,
    results_count: results.length,
    user_id: profileId,
  })

  return results.map((p: any) => {
    const images = p.product_images || []
    const primaryImg = images.find((i: any) => i.is_primary)?.url || images[0]?.url || null
    return {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      description: p.description,
      image: primaryImg,
    }
  })
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
  const { data: product } = await admin.from('products').select('id, name').eq('id', productId).maybeSingle()
  if (!product) {
    return { error: 'product_not_found' }
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
