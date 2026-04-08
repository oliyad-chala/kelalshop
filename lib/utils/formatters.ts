// Currency formatting (ETB primary, USD in parentheses)
const USD_TO_ETB = 56.5 // Fixed demo rate

export function formatETB(amount: number): string {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPrice(etbAmount: number): string {
  const usd = etbAmount / USD_TO_ETB
  return `${formatETB(etbAmount)} (${formatUSD(usd)})`
}

// Date formatting
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ET', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString))
}

export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(dateString)
}

// Text helpers
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '…'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Rating helpers
export function formatRating(score: number): string {
  return score.toFixed(1)
}

export function getRatingStars(score: number): string {
  const full = Math.floor(score)
  const half = score - full >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty)
}

// Status display helpers
export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'amber',
    accepted: 'blue',
    shipped: 'indigo',
    delivered: 'green',
    cancelled: 'red',
    disputed: 'orange',
  }
  return map[status] ?? 'gray'
}

export function getRequestStatusColor(status: string): string {
  const map: Record<string, string> = {
    open: 'green',
    assigned: 'blue',
    completed: 'gray',
    cancelled: 'red',
  }
  return map[status] ?? 'gray'
}

export function getVerificationLabel(status: string): string {
  const map: Record<string, string> = {
    unverified: 'Unverified',
    pending: 'Pending Review',
    verified: 'Verified',
    rejected: 'Rejected',
  }
  return map[status] ?? status
}
