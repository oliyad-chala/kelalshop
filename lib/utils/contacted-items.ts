export interface ContactedProductItem {
  productId: string
  productName: string
  productPrice: number
  productImage?: string | null
  sellerId?: string
  sellerName?: string
  sellerPhone?: string | null
  sellerLocation?: string | null
  contactedAt: string
  channel: 'phone' | 'telegram' | 'chat'
}

export const CONTACTED_ITEMS_KEY = 'kelalshop_contacted_items_v1'

export function saveContactedProduct(item: Omit<ContactedProductItem, 'contactedAt'>) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(CONTACTED_ITEMS_KEY)
    let list: ContactedProductItem[] = raw ? JSON.parse(raw) : []
    // Remove duplicate for the same product, then prepend newest
    list = list.filter((i) => i.productId !== item.productId)
    list.unshift({ ...item, contactedAt: new Date().toISOString() })
    // Keep last 30
    localStorage.setItem(CONTACTED_ITEMS_KEY, JSON.stringify(list.slice(0, 30)))
  } catch (err) {
    console.error('Failed to save contacted item:', err)
  }
}

export function getContactedProducts(): ContactedProductItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CONTACTED_ITEMS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function removeContactedProduct(productId: string) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(CONTACTED_ITEMS_KEY)
    if (!raw) return
    const list: ContactedProductItem[] = JSON.parse(raw)
    const filtered = list.filter((i) => i.productId !== productId)
    localStorage.setItem(CONTACTED_ITEMS_KEY, JSON.stringify(filtered))
  } catch (err) {
    console.error('Failed to remove contacted item:', err)
  }
}
