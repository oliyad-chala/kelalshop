import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminRole } from '@/lib/utils/admin-roles'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY

export async function POST(req: Request) {
  // 1. Auth — must be admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!CHAPA_SECRET_KEY) {
    return NextResponse.json({ error: 'Chapa not configured' }, { status: 500 })
  }

  const body = await req.json()
  const { tx_ref, payment_request_id, provider = 'cbe' } = body

  if (!tx_ref || !payment_request_id) {
    return NextResponse.json({ error: 'tx_ref and payment_request_id are required' }, { status: 400 })
  }

  // 2. Get the payment request from DB
  const admin = createAdminClient()
  const { data: payment, error: dbErr } = await admin
    .from('payment_requests')
    .select('*')
    .eq('id', payment_request_id)
    .single()

  if (dbErr || !payment) {
    return NextResponse.json({ error: 'Payment request not found' }, { status: 404 })
  }

  if (payment.status !== 'pending') {
    return NextResponse.json({ error: `Payment is already ${payment.status}` }, { status: 400 })
  }

  // 3. Verify with Payment Gateway (ShegerPay or Chapa)
  let isVerified = false
  let verifiedAmount = 0
  let errorMessage: string | null = null

  // Attempt 1: Try ShegerPay verification with chosen provider (cbe or telebirr)
  try {
    const shegerRes = await fetch('https://api.shegerpay.com/api/v1/verify', {
      method: 'POST',
      headers: {
        'X-API-Key': CHAPA_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: provider,
        transaction_id: tx_ref,
        amount: Number(payment.amount),
      }),
    })

    const shegerData = await shegerRes.json()

    if (shegerData?.valid === true || shegerData?.verified === true || shegerData?.status === 'success') {
      isVerified = true
      verifiedAmount = Number(shegerData.amount ?? payment.amount)
    } else if (shegerData?.reason || shegerData?.message) {
      errorMessage = shegerData.reason || shegerData.message
    }
  } catch (err: any) {
    console.warn('[Verify] ShegerPay check failed:', err.message)
  }

  // Attempt 2: Fallback to Chapa verification if not verified
  if (!isVerified && !errorMessage?.includes('Invalid')) {
    try {
      const chapaRes = await fetch(
        `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(tx_ref)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const chapaData = await chapaRes.json()
      const chapaStatus = chapaData?.data?.status ?? chapaData?.status
      const chapaPaidAmount = Number(chapaData?.data?.amount ?? chapaData?.amount ?? 0)

      if (chapaRes.ok && chapaStatus === 'success') {
        if (chapaPaidAmount >= Number(payment.amount)) {
          isVerified = true
          verifiedAmount = chapaPaidAmount
        } else {
          return NextResponse.json({
            error: `Amount mismatch: Paid ETB ${chapaPaidAmount}, expected ETB ${payment.amount}`,
          }, { status: 422 })
        }
      } else if (!errorMessage) {
        errorMessage = chapaData?.message || `Status: ${chapaStatus || 'failed'}`
      }
    } catch (err: any) {
      console.warn('[Verify] Chapa check failed:', err.message)
    }
  }

  if (!isVerified) {
    return NextResponse.json({
      error: `Verification failed: ${errorMessage || 'Transaction could not be confirmed'}`,
    }, { status: 422 })
  }

  // 5. Apply subscription/boost effect (mirrors approvePayment in admin.ts)
  try {
    if (payment.payment_type === 'pro_subscription' || payment.payment_type === 'pro_subscription_monthly') {
      const expires = new Date()
      expires.setDate(expires.getDate() + 30)
      await admin.from('shopper_profiles').update({
        subscription_plan: 'monthly',
        subscription_expires_at: expires.toISOString(),
        updated_at: new Date().toISOString(),
      } as any).eq('id', payment.shopper_id)
    } else if (payment.payment_type === 'pro_subscription_yearly') {
      const expires = new Date()
      expires.setFullYear(expires.getFullYear() + 1)
      await admin.from('shopper_profiles').update({
        subscription_plan: 'yearly',
        subscription_expires_at: expires.toISOString(),
        updated_at: new Date().toISOString(),
      } as any).eq('id', payment.shopper_id)
    } else if (payment.payment_type === 'boost_7_days' || payment.payment_type === 'boost_28_days') {
      if (!payment.target_id) throw new Error('Missing product target ID')
      const days = payment.payment_type === 'boost_7_days' ? 7 : 28
      const expires = new Date()
      expires.setDate(expires.getDate() + days)
      await admin.from('products').update({
        is_featured: true,
        boosted_until: expires.toISOString(),
        updated_at: new Date().toISOString(),
      } as any).eq('id', payment.target_id)
    }

    // 6. Save reference_number and mark approved
    await admin.from('payment_requests').update({
      status: 'approved',
      reference_number: tx_ref,
      updated_at: new Date().toISOString(),
    } as any).eq('id', payment_request_id)

    revalidatePath('/admin/payouts')

    return NextResponse.json({
      success: true,
      message: `Verified — ETB ${verifiedAmount} confirmed. Payment auto-approved.`,
      amount: verifiedAmount,
    })
  } catch (err: any) {
    return NextResponse.json({ error: `Approval failed: ${err.message}` }, { status: 500 })
  }
}
