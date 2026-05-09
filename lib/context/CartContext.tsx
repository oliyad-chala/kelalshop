'use client'

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useTransition,
  type ReactNode,
} from 'react'
import { addToCart, removeFromCart, updateCartQty, clearCart } from '@/lib/actions/cart'

// ── Types ───────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string          // cart_items.id
  quantity: number
  product: {
    id: string
    name: string
    price: number
    stock: number
    is_available: boolean
    image: string | null
    shopperName: string
    shopperId: string
  }
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  isLoading: boolean
}

type CartAction =
  | { type: 'SET_ITEMS'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'UPDATE_QTY'; id: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_LOADING'; value: boolean }

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload }
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.product.id === action.payload.product.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.product.id === action.payload.product.id
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        }
      }
      return { ...state, items: [action.payload, ...state.items] }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.id) }
    case 'UPDATE_QTY':
      if (action.quantity <= 0)
        return { ...state, items: state.items.filter(i => i.id !== action.id) }
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, quantity: action.quantity } : i
        ),
      }
    case 'CLEAR':
      return { ...state, items: [] }
    case 'OPEN':
      return { ...state, isOpen: true }
    case 'CLOSE':
      return { ...state, isOpen: false }
    case 'SET_LOADING':
      return { ...state, isLoading: action.value }
    default:
      return state
  }
}

// ── Context ─────────────────────────────────────────────────────────────────

interface CartContextValue {
  state: CartState
  addItem: (product: CartItem['product'], quantity?: number) => Promise<void>
  removeItem: (cartItemId: string) => Promise<void>
  updateQty: (cartItemId: string, quantity: number) => Promise<void>
  emptyCart: () => Promise<void>
  openCart: () => void
  closeCart: () => void
  totalItems: number
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

// ── Provider ─────────────────────────────────────────────────────────────────

interface CartProviderProps {
  children: ReactNode
  initialItems?: CartItem[]
}

export function CartProvider({ children, initialItems = [] }: CartProviderProps) {
  const [state, dispatch] = useReducer(reducer, {
    items: initialItems,
    isOpen: false,
    isLoading: false,
  })
  const [, startTransition] = useTransition()

  const addItem = useCallback(async (product: CartItem['product'], quantity = 1) => {
    // Optimistic update
    dispatch({
      type: 'ADD_ITEM',
      payload: { id: `temp-${product.id}`, quantity, product },
    })
    dispatch({ type: 'OPEN' })

    const result = await addToCart(product.id, quantity)
    if (result?.error === 'not_authenticated') {
      // Revert and redirect handled by page
      dispatch({ type: 'REMOVE_ITEM', id: `temp-${product.id}` })
    }
  }, [])

  const removeItem = useCallback(async (cartItemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', id: cartItemId })
    startTransition(() => { removeFromCart(cartItemId) })
  }, [])

  const updateQty = useCallback(async (cartItemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QTY', id: cartItemId, quantity })
    startTransition(() => { updateCartQty(cartItemId, quantity) })
  }, [])

  const emptyCart = useCallback(async () => {
    dispatch({ type: 'CLEAR' })
    startTransition(() => { clearCart() })
  }, [])

  const openCart = useCallback(() => dispatch({ type: 'OPEN' }), [])
  const closeCart = useCallback(() => dispatch({ type: 'CLOSE' }), [])

  const totalItems = state.items.reduce((n, i) => n + i.quantity, 0)
  const subtotal = state.items.reduce((n, i) => n + i.product.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{
      state, addItem, removeItem, updateQty, emptyCart, openCart, closeCart, totalItems, subtotal,
    }}>
      {children}
    </CartContext.Provider>
  )
}
