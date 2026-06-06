---
name: Marketing Center Full Loop
overview: "Make the Marketing Center fully functional end-to-end: fix DB/schema drift, standardize admin UI, complete seller opt-in, add public campaign page, and apply campaign sale prices across product display, cart, and checkout."
todos:
  - id: db-pricing
    content: Add migration_promotions_v2.sql (description + get_active_campaign_price), update schema.sql and database.types.ts
    status: completed
  - id: pricing-helper
    content: Create lib/utils/campaign-pricing.ts shared price resolution helper
    status: completed
  - id: admin-list-crud
    content: Refactor admin promotions list to PromotionsTable; add edit/delete/status sync and CampaignForm
    status: completed
  - id: admin-detail
    content: Polish CampaignDetailClient with router.refresh(), status controls, ETB formatting
    status: completed
  - id: seller-optin
    content: Implement campaigns-seller.ts actions + CampaignJoinModal + wire dashboard/campaigns page
    status: completed
  - id: public-page
    content: Create app/(shop)/promotions/[id]/page.tsx and fix FlashSaleCarousel ETB/links
    status: completed
  - id: checkout-pricing
    content: Apply campaign sale prices on product page, cart, and createOrder server-side
    status: completed
isProject: false
---

# Marketing Center — Full Standard Implementation

Make the admin Marketing Center (currently empty/stats-only) into a complete marketplace campaign flow: **Admin creates → Seller opts in → Admin approves → Buyers see sale prices → Checkout uses campaign price**.

```mermaid
flowchart LR
  AdminCreate["Admin: create campaign"] --> SellerJoin["Seller: opt-in products"]
  SellerJoin --> AdminReview["Admin: approve/reject"]
  AdminReview --> PublicView["Public: /promotions/id"]
  PublicView --> ProductPage["Product page shows sale price"]
  ProductPage --> Checkout["Checkout uses special_price"]
```

---

## Current gaps (why the page shows all zeros)

1. **DB may be missing tables** — [`supabase/migration_promotions.sql`](supabase/migration_promotions.sql) is not in [`supabase/schema.sql`](supabase/schema.sql); must be run in Supabase.
2. **Create campaign can fail** — [`lib/actions/campaigns.ts`](lib/actions/campaigns.ts) inserts `description`, but the migration has no `description` column.
3. **Seller opt-in is dead** — [`app/(shop)/dashboard/campaigns/page.tsx`](app/(shop)/dashboard/campaigns/page.tsx) has a non-functional "Join Campaign" button.
4. **Public page missing** — [`FlashSaleCarousel.tsx`](components/promotions/FlashSaleCarousel.tsx) links to `/promotions/[id]` which does not exist.
5. **Sale prices not applied** — product page, cart, and [`createOrder`](lib/actions/orders.ts) use base `products.price` only.
6. **UI not standard** — admin promotions pages use heavy inline styles instead of existing admin patterns (`admin-card`, `admin-btn`, `DataTable`, `ConfirmModal`).

---

## Phase 1 — Database and shared pricing (foundation)

### 1.1 Migration fixes

**New:** [`supabase/migration_promotions_v2.sql`](supabase/migration_promotions_v2.sql)

- `ALTER TABLE promotions ADD COLUMN IF NOT EXISTS description text`
- Ensure enums/tables exist (idempotent `IF NOT EXISTS` where safe)
- Add SQL helper:

```sql
-- Returns best active approved campaign price for a product, or null
create or replace function get_active_campaign_price(p_product_id uuid)
returns numeric language sql stable as $$
  select pp.special_price
  from promotion_products pp
  join promotions p on p.id = pp.promotion_id
  where pp.product_id = p_product_id
    and pp.status = 'approved'
    and p.is_active = true
    and p.status = 'active'
    and p.type = 'flash_sale_campaign'
    and now() between p.start_date and p.end_date
  order by pp.special_price asc
  limit 1;
$$;
```

**Update:** [`supabase/schema.sql`](supabase/schema.sql) — include promotions tables + `description` for fresh installs.

**Update:** [`types/database.types.ts`](types/database.types.ts) — add `description` to `promotions` Row/Insert.

### 1.2 Shared TS helper

**New:** [`lib/utils/campaign-pricing.ts`](lib/utils/campaign-pricing.ts)

- `getActiveCampaignOffer(supabase, productId)` — query approved row in active campaign
- `resolveDisplayPrice(basePrice, offer)` — returns `{ price, originalPrice, discountPct, campaignId }`
- Used by product page, carousel, public campaign page, cart, and order creation

---

## Phase 2 — Admin Marketing Center (standard UI + full CRUD)

Refactor to match other admin pages (e.g. [`payouts/page.tsx`](app/admin/(protected)/payouts/page.tsx), [`ProductDataTable`](components/admin/products/ProductDataTable.tsx)).

### 2.1 List page

**Update:** [`app/admin/(protected)/promotions/page.tsx`](app/admin/(protected)/promotions/page.tsx)

- Replace inline-styled table with server page + **`PromotionsTable.tsx`** client component using `DataTable`
- Show real **product counts** per campaign (approved / pending)
- Actions: Manage, Activate, End, **Delete** (wire existing `deleteCampaign` + `ConfirmModal`)
- Keep `canManage` staff read-only behavior
- Auto-sync campaign status by date on fetch (upcoming/active/ended helper — no cron needed initially)

### 2.2 Create / edit form

**New:** [`components/admin/promotions/CampaignForm.tsx`](components/admin/promotions/CampaignForm.tsx) — shared form using `admin-card`, `admin-input`, `admin-btn`

**Update:** [`app/admin/(protected)/promotions/new/page.tsx`](app/admin/(protected)/promotions/new/page.tsx) — use `CampaignForm`

**New:** [`app/admin/(protected)/promotions/[id]/edit/page.tsx`](app/admin/(protected)/promotions/[id]/edit/page.tsx) + `updateCampaign` server action

### 2.3 Detail page polish

**Update:** [`CampaignDetailClient.tsx`](app/admin/(protected)/promotions/[id]/CampaignDetailClient.tsx)

- Call `router.refresh()` after approve/reject/force-add/remove
- Add Activate/End status buttons (reuse `updateCampaignStatus`)
- Use ETB consistently

---

## Phase 3 — Seller opt-in (standard seller dashboard flow)

**New actions in** [`lib/actions/campaigns-seller.ts`](lib/actions/campaigns-seller.ts) (shopper session, not admin):

- `getSellerCampaignProducts(promotionId)` — seller's approved products eligible to join
- `submitCampaignProduct(promotionId, productId, specialPrice)` — insert `promotion_products` as `pending`
- `withdrawCampaignProduct(promotionId, productId)` — delete own pending opt-in
- Validate: verified seller, product ownership, `special_price <= products.price`, meets `discount_percentage` minimum

**New:** [`components/dashboard/CampaignJoinModal.tsx`](components/dashboard/CampaignJoinModal.tsx)

- Product picker + special price input with live discount preview

**Update:** [`app/(shop)/dashboard/campaigns/page.tsx`](app/(shop)/dashboard/campaigns/page.tsx)

- Wire "Join Campaign" to modal
- Show all seller opt-ins per campaign (not just first match)
- Allow withdraw when status is `pending`

---

## Phase 4 — Public campaign page + homepage fixes

**New:** [`app/(shop)/promotions/[id]/page.tsx`](app/(shop)/promotions/[id]/page.tsx)

- Campaign header (name, countdown, banner, dates, geo)
- Grid of approved products with ETB sale/original prices
- Links to product detail pages

**Update:** [`components/promotions/FlashSaleCarousel.tsx`](components/promotions/FlashSaleCarousel.tsx)

- `$` → `formatPrice` (ETB)
- Link to `/promotions/${campaign.id}` (now exists)

**Update:** [`components/promotions/GeoPromoBanner.tsx`](components/promotions/GeoPromoBanner.tsx) — optional CTA link when type is `banner`

---

## Phase 5 — Sale price at product, cart, and checkout

**Update:** [`app/(shop)/products/[id]/page.tsx`](app/(shop)/products/[id]/page.tsx)

- Fetch active campaign offer via `getActiveCampaignOffer`
- Show strikethrough original + sale badge when on campaign
- Pass resolved price into `BuyButton`

**Update:** [`app/(shop)/products/[id]/BuyButton.tsx`](app/(shop)/products/[id]/BuyButton.tsx) + [`CartContext`](lib/context/CartContext.tsx)

- Cart item stores `price` as effective sale price when applicable

**Update:** [`lib/actions/orders.ts`](lib/actions/orders.ts) — `createOrder(productId)`

- Server-side: resolve campaign price via `get_active_campaign_price` RPC or TS helper before creating order
- Never trust client-submitted price

**Update:** [`components/cart/CheckoutForm.tsx`](components/cart/CheckoutForm.tsx) — display uses cart effective prices (already derived from product.price in cart)

---

## Phase 6 — Verification checklist

1. Run `migration_promotions.sql` (if not run) + `migration_promotions_v2.sql` in Supabase
2. Admin: create flash sale → appears in Marketing Center stats/table
3. Seller: `/dashboard/campaigns` → Join → pick product + sale price → status `pending`
4. Admin: `/admin/promotions/[id]` → approve submission
5. Homepage carousel + `/promotions/[id]` show approved products in ETB
6. Product page shows sale price; checkout order amount matches sale price
7. Staff still read-only on Marketing Center list; admin-only on create/edit/detail

---

## Files to create / change (summary)

| Area | Files |
|------|-------|
| DB | `migration_promotions_v2.sql`, `schema.sql`, `database.types.ts` |
| Pricing | `lib/utils/campaign-pricing.ts` |
| Admin UI | `PromotionsTable.tsx`, `CampaignForm.tsx`, refactor `promotions/page.tsx`, `[id]/edit/page.tsx`, `CampaignDetailClient.tsx` |
| Seller | `campaigns-seller.ts`, `CampaignJoinModal.tsx`, `dashboard/campaigns/page.tsx` |
| Public | `app/(shop)/promotions/[id]/page.tsx`, `FlashSaleCarousel.tsx` |
| Checkout | `products/[id]/page.tsx`, `BuyButton.tsx`, `orders.ts` |
| Actions | extend `campaigns.ts` with `updateCampaign` |

**Out of scope (Phase 3+ later):** `shipping` campaign type behavior, banner upload to Supabase Storage, automatic cron for status transitions, checkout RPC migration if `create_order` is missing in production DB (will verify and patch during implementation).
