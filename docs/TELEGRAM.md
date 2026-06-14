# KelalShop Telegram Bots

Two bots: **Admin** (staff operations) and **Customer** (shopping support).

## Important: Website admin ≠ Telegram admin

Being `admin` on kelalshop.com does **not** grant Telegram bot access. Access requires:

1. Your Telegram chat ID in `telegram_admins` with `is_approved = true`, **or**
2. Matching `ADMIN_CHAT_ID` in environment variables.

### Register yourself as Telegram admin

```bash
# Set ADMIN_CHAT_ID in .env.local to your Telegram numeric chat ID
npm run make-admin -- your@email.com
```

Or insert in Supabase:

```sql
INSERT INTO telegram_admins (telegram_chat_id, username, role, is_approved)
VALUES (YOUR_CHAT_ID, 'Your Name', 'admin', true)
ON CONFLICT (telegram_chat_id) DO UPDATE SET is_approved = true, role = 'admin';
```

Get your chat ID: message [@userinfobot](https://t.me/userinfobot) on Telegram.

## Production (Vercel webhooks only)

Do **not** run `npm run bot` or `npm run customer-bot` in production — use webhooks.

```bash
npm run set-webhooks https://kelalshop.com
npm run check-webhooks
npm run sync-bot-commands
```

## Required environment variables

| Variable | Purpose |
|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Admin bot token |
| `TELEGRAM_CUSTOMER_BOT_TOKEN` | Customer bot token |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook validation |
| `ADMIN_CHAT_ID` | Bootstrap super-admin chat ID |
| `INTERNAL_API_KEY` | Internal notification API |
| `GEMINI_API_KEY` | AI assistant |
| `SUPABASE_SERVICE_ROLE_KEY` | Bot database access |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `RESEND_API_KEY` | OTP email (optional; falls back to console in dev) |

## Migrations

Run in Supabase SQL editor:

1. `supabase/migration_telegram_bot.sql`
2. `supabase/migration_customer_bot.sql`
3. `supabase/migration_telegram_enterprise.sql`

## Dev-only polling

```bash
npm run bot          # Admin bot (local only)
npm run customer-bot # Customer bot (local only)
```
