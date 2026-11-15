import { NextResponse } from 'next/server'
import { getTelegramSupabase } from '@/lib/telegram/core/supabase-admin'
import { emitTelegramEvent } from '@/lib/telegram/notifications/templates'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    const supabase = getTelegramSupabase()

    if (productId) {
      const { data: product, error } = await supabase
        .from('products')
        .select('id, name, description, price, is_available, approval_status, product_images(url, is_primary), profiles:shopper_id(id, full_name, phone)')
        .eq('id', productId)
        .maybeSingle()

      if (error || !product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      const images = (product as any).product_images || []
      const primaryImage = images.find((img: any) => img.is_primary)?.url || images[0]?.url || null

      return NextResponse.json({
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: Number(product.price),
          is_available: product.is_available,
          approval_status: product.approval_status,
          image: primaryImage,
          shopper: (product as any).profiles || null,
        },
      })
    }

    // Fetch storefront catalog with categories and search support
    const categorySlug = searchParams.get('category')
    const search = searchParams.get('search')

    let query = supabase
      .from('products')
      .select('id, name, description, price, is_available, approval_status, category_id, categories:category_id(id, name, slug), profiles:shopper_id(id, full_name, trust_score), product_images(url, is_primary)')
      .eq('is_available', true)
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(40)

    if (search && search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`)
    }

    const [{ data: products, error }, { data: categories }] = await Promise.all([
      query,
      supabase.from('categories').select('id, name, slug').order('name'),
    ])

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    let filtered = products || []
    if (categorySlug && categorySlug !== 'all') {
      filtered = filtered.filter((p: any) => p.categories?.slug === categorySlug || p.categories?.name === categorySlug)
    }

    const formatted = filtered.map((p: any) => {
      const imgs = p.product_images || []
      const shopper = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
      const category = Array.isArray(p.categories) ? p.categories[0] : p.categories
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        is_available: p.is_available,
        category: category?.name || 'General',
        categorySlug: category?.slug || 'general',
        shopper: shopper || null,
        image: imgs.find((img: any) => img.is_primary)?.url || imgs[0]?.url || null,
      }
    })

    return NextResponse.json({
      products: formatted,
      categories: categories || [],
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      productId,
      quantity = 1,
      fullName,
      phone,
      city,
      address,
      paymentMethod = 'cod',
      deliveryNotes,
      telegramUser,
    } = body

    if (!productId || !phone || !address) {
      return NextResponse.json(
        { error: 'Missing required fields: product, phone, and delivery address are required.' },
        { status: 400 }
      )
    }

    const supabase = getTelegramSupabase()

    // 1. Fetch product
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('id, name, price, shopper_id, is_available, approval_status, profiles:shopper_id(full_name, phone)')
      .eq('id', productId)
      .single()

    if (prodError || !product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
    }
    if (!product.is_available) {
      return NextResponse.json({ error: 'This item is currently out of stock.' }, { status: 400 })
    }
    if (product.approval_status !== 'approved') {
      return NextResponse.json({ error: 'This product cannot be purchased yet.' }, { status: 400 })
    }

    const shopperProfile = Array.isArray(product.profiles) ? product.profiles[0] : product.profiles
    const price = Number(product.price)
    const qty = Math.max(1, parseInt(quantity, 10) || 1)
    const totalAmount = price * qty

    // 2. Resolve or provision buyer profile
    let buyerProfileId: string | null = null

    if (telegramUser?.id) {
      const chatId = Number(telegramUser.id)
      const { data: tgUser } = await supabase
        .from('telegram_users')
        .select('profile_id')
        .eq('chat_id', chatId)
        .maybeSingle()

      if (tgUser?.profile_id) {
        buyerProfileId = tgUser.profile_id
      } else {
        // Auto-provision
        const customerName = fullName || [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') || 'Telegram Customer'
        const email = `tg_${chatId}_${Date.now()}@kelalshop.local`

        const { data: authData } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            full_name: customerName,
            role: 'buyer',
            telegram_chat_id: chatId,
            telegram_username: telegramUser.username || null,
          },
        })

        if (authData?.user) {
          buyerProfileId = authData.user.id
          await supabase.from('telegram_users').upsert(
            {
              chat_id: chatId,
              profile_id: buyerProfileId,
              username: telegramUser.username || null,
              first_name: telegramUser.first_name || null,
              is_verified: true,
              linked_at: new Date().toISOString(),
            },
            { onConflict: 'chat_id' }
          )
        }
      }
    }

    // Fallback: if no telegram user passed, find or create anonymous guest buyer
    if (!buyerProfileId) {
      const { data: shopperUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'buyer')
        .limit(1)
        .maybeSingle()
      buyerProfileId = shopperUser?.id || product.shopper_id
    }

    const paymentTitles: Record<string, string> = {
      cod: 'Cash on Delivery / Handover',
      telebirr: 'Telebirr Transfer',
      cbe: 'CBE Birr / Commercial Bank',
    }
    const paymentTitle = paymentTitles[paymentMethod] || 'Cash on Delivery'

    const fullLocation = [city, address].filter(Boolean).join(' - ')
    const formattedNotes =
      `[Telegram Mini App Order] Customer: ${fullName || 'Telegram Customer'} | ` +
      `Phone: ${phone} | Delivery: ${fullLocation} | Payment: ${paymentTitle} | Qty: ${qty}` +
      (deliveryNotes ? ` | Notes: ${deliveryNotes}` : '')

    // 3. Insert order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        product_id: product.id,
        buyer_id: buyerProfileId,
        shopper_id: product.shopper_id,
        amount: totalAmount,
        status: 'pending',
        notes: formattedNotes,
      })
      .select('id')
      .single()

    if (orderError || !newOrder) {
      console.error('[Direct Checkout] Order insert error:', orderError)
      return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 })
    }

    // Update buyer phone in profiles if empty
    if (phone && buyerProfileId) {
      await supabase
        .from('profiles')
        .update({ phone })
        .eq('id', buyerProfileId)
        .is('phone', null)
    }

    // 4. Emit notifications
    emitTelegramEvent('admin', 'NEW_ORDER', { orderId: newOrder.id, amount: totalAmount }, {
      idempotencyKey: `miniapp-order-${newOrder.id}`,
    })
    emitTelegramEvent('customer', 'ORDER_RECEIVED', { orderId: newOrder.id, amount: totalAmount }, {
      targetProfileId: product.shopper_id,
      idempotencyKey: `miniapp-shopper-${newOrder.id}`,
    })

    return NextResponse.json({
      success: true,
      orderId: newOrder.id,
      productName: product.name,
      totalAmount,
      shopperName: shopperProfile?.full_name || 'Verified Shopper',
      shopperPhone: shopperProfile?.phone || null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    console.error('[Direct Checkout API] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
