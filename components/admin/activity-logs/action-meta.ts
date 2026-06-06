// Shared action metadata: label + badge colour used in table & modal
export const ACTION_META: Record<string, { label: string; color: string; bg: string }> = {
  login:                { label: 'Login',              color: '#2563eb', bg: '#eff6ff' },
  logout:               { label: 'Logout',             color: '#64748b', bg: '#f1f5f9' },
  create_product:       { label: 'Create Product',     color: '#059669', bg: '#ecfdf5' },
  update_product:       { label: 'Update Product',     color: '#d97706', bg: '#fffbeb' },
  delete_product:       { label: 'Delete Product',     color: '#dc2626', bg: '#fff1f2' },
  approve_product:      { label: 'Approve Product',    color: '#059669', bg: '#ecfdf5' },
  reject_product:       { label: 'Reject Product',     color: '#dc2626', bg: '#fff1f2' },
  approve_seller:       { label: 'Approve Seller',     color: '#059669', bg: '#ecfdf5' },
  reject_seller:        { label: 'Reject Seller',      color: '#dc2626', bg: '#fff1f2' },
  suspend_user:         { label: 'Suspend User',       color: '#ea580c', bg: '#fff7ed' },
  unsuspend_user:       { label: 'Unsuspend User',     color: '#0891b2', bg: '#ecfeff' },
  update_order_status:  { label: 'Update Order',       color: '#7c3aed', bg: '#f5f3ff' },
  approve_payment:      { label: 'Approve Payment',    color: '#059669', bg: '#ecfdf5' },
  reject_payment:       { label: 'Reject Payment',     color: '#dc2626', bg: '#fff1f2' },
  update_settings:      { label: 'Update Settings',    color: '#4f46e5', bg: '#eef2ff' },
  toggle_product_boost: { label: 'Boost Product',      color: '#d97706', bg: '#fffbeb' },
  update_subscription:  { label: 'Update Subscription',color: '#0891b2', bg: '#ecfeff' },
  toggle_top_shopper:   { label: 'Top Shopper',        color: '#d97706', bg: '#fffbeb' },
}

export const ACTION_TYPE_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  ...Object.entries(ACTION_META).map(([value, { label }]) => ({ value, label })),
]

export const ENTITY_TYPE_OPTIONS = [
  { value: 'all',          label: 'All Entities' },
  { value: 'product',      label: 'Product' },
  { value: 'seller',       label: 'Seller' },
  { value: 'user',         label: 'User' },
  { value: 'order',        label: 'Order' },
  { value: 'payment',      label: 'Payment' },
  { value: 'settings',     label: 'Settings' },
  { value: 'subscription', label: 'Subscription' },
]
