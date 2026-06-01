export const PRO_SUBSCRIPTION_MONTHLY_ETB = 1000
export const BOOST_7_DAYS_ETB = 300
export const BOOST_28_DAYS_ETB = 3000

export type PaymentTypeKey =
  | 'pro_subscription'
  | 'boost_7_days'
  | 'boost_28_days'
  | 'banner_ad'

const AMOUNTS: Record<PaymentTypeKey, number> = {
  pro_subscription: PRO_SUBSCRIPTION_MONTHLY_ETB,
  boost_7_days: BOOST_7_DAYS_ETB,
  boost_28_days: BOOST_28_DAYS_ETB,
  banner_ad: 5000,
}

export function getPaymentAmount(paymentType: string): number | null {
  if (paymentType in AMOUNTS) {
    return AMOUNTS[paymentType as PaymentTypeKey]
  }
  return null
}

export function formatEtb(amount: number): string {
  return `${amount.toLocaleString('en-US')} ETB`
}

export function formatBoostOptionLabel(key: 'boost_7_days' | 'boost_28_days'): string {
  if (key === 'boost_7_days') {
    return `7 Days — ${formatEtb(BOOST_7_DAYS_ETB)}`
  }
  return `28 Days — ${formatEtb(BOOST_28_DAYS_ETB)}`
}
