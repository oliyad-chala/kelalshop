export const PRO_SUBSCRIPTION_MONTHLY_ETB = 1000
export const PRO_SUBSCRIPTION_YEARLY_ETB = 8000
export const BOOST_7_DAYS_ETB = 300
export const BOOST_28_DAYS_ETB = 3000

export type PaymentTypeKey =
  | 'pro_subscription'
  | 'pro_subscription_monthly'
  | 'pro_subscription_yearly'
  | 'boost_7_days'
  | 'boost_28_days'
  | 'banner_ad'

const AMOUNTS: Record<PaymentTypeKey, number> = {
  pro_subscription: PRO_SUBSCRIPTION_MONTHLY_ETB, // legacy alias
  pro_subscription_monthly: PRO_SUBSCRIPTION_MONTHLY_ETB,
  pro_subscription_yearly: PRO_SUBSCRIPTION_YEARLY_ETB,
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

export interface PlanFeature {
  text: string
  included: boolean
}

export interface PlanConfig {
  key: 'free' | 'monthly' | 'yearly'
  paymentType: PaymentTypeKey | null
  name: string
  price: number
  period: string | null
  badge: string | null
  highlight: boolean
  savings: string | null
  features: PlanFeature[]
}

export const SUBSCRIPTION_PLANS: PlanConfig[] = [
  {
    key: 'free',
    paymentType: null,
    name: 'Free',
    price: 0,
    period: null,
    badge: null,
    highlight: false,
    savings: null,
    features: [
      { text: 'Up to 3 active listings', included: true },
      { text: 'Direct buyer payments', included: true },
      { text: '0% commission', included: true },
      { text: 'Basic customer support', included: true },
      { text: 'Priority support', included: false },
      { text: 'Unlimited listings', included: false },
      { text: 'Product boosts discount', included: false },
    ],
  },
  {
    key: 'monthly',
    paymentType: 'pro_subscription_monthly',
    name: 'Pro Monthly',
    price: PRO_SUBSCRIPTION_MONTHLY_ETB,
    period: 'month',
    badge: null,
    highlight: false,
    savings: null,
    features: [
      { text: 'Unlimited active listings', included: true },
      { text: 'Direct buyer payments', included: true },
      { text: '0% commission', included: true },
      { text: 'Priority customer support', included: true },
      { text: 'Analytics dashboard', included: true },
      { text: 'Product boosts discount', included: false },
      { text: 'Dedicated account manager', included: false },
    ],
  },
  {
    key: 'yearly',
    paymentType: 'pro_subscription_yearly',
    name: 'Pro Yearly',
    price: PRO_SUBSCRIPTION_YEARLY_ETB,
    period: 'year',
    badge: 'Best Value',
    highlight: true,
    savings: 'Save 33%',
    features: [
      { text: 'Unlimited active listings', included: true },
      { text: 'Direct buyer payments', included: true },
      { text: '0% commission', included: true },
      { text: 'Priority customer support', included: true },
      { text: 'Analytics dashboard', included: true },
      { text: 'Product boosts discount', included: true },
      { text: 'Dedicated account manager', included: true },
    ],
  },
]
