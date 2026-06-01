/** Default delivery fee shown at checkout (ETB). Override via env. */
export const DEFAULT_SHIPPING_FEE_ETB = Number(
  process.env.NEXT_PUBLIC_DEFAULT_SHIPPING_FEE ?? 150
)
