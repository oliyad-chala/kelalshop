/**
 * Barrel file that exports reusable handler functions from all flows.
 * Import this file to get references to flow handlers without re-registering
 * grammy middleware (flow files auto-register when imported).
 *
 * NOTE: Do NOT import flow files directly in search.flow.ts to avoid
 * circular dependencies. Import from this barrel instead.
 */

// Re-export from each flow
export { handleDeals } from "./deals.flow";
export { handleOrders } from "./orders.flow";
export { handleSupportPrompt } from "./support.flow";
export { handleLinkPrompt } from "./auth.flow";
