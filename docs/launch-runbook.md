# Launch Runbook

Operational checklist for deploying Nexar Network to production.

## Pre-deploy

```bash
cp .env.production.example .env.local   # reference only — set vars in host dashboard
supabase db push                         # apply all 13 migrations to production Supabase
npm run prelaunch                        # typecheck + lint + build
```

For local builds without full Supabase env, use `npm run build:local` (sets `SKIP_ENV_VALIDATION=true`).

Verify locally:
- `GET /api/health` returns `healthy` or documents `degraded` reasons
- Login, checkout, and payment popup work against staging Supabase
- Run `scripts/rls-audit.sql` — zero tables without RLS

## Deploy (Netlify)

1. Push to production branch
2. Set all env vars from `.env.production.example` in Netlify dashboard
3. Confirm build uses `netlify.toml` with `@netlify/plugin-nextjs`
4. Run post-deploy smoke tests (below)

## Post-deploy smoke tests

| Step | Action | Expected |
|---|---|---|
| 1 | `GET /api/health` | `status: healthy` or `degraded` with no `error` checks |
| 2 | Visit `/login` | Page loads, OAuth buttons visible |
| 3 | Admin login → `/admin/dashboard` | Stats cards render |
| 4 | Activate test merchant store | Store status → active |
| 5 | Create product → browse as customer | Product visible |
| 6 | Checkout → Pay now (testnet) | Payment popup with QR, session created |
| 7 | Check Sentry | No unhandled errors from smoke test |
| 8 | Submit `/contact` form | Message appears in Admin → Contact |
| 9 | Approve merchant store | Merchant receives notification + QR codes |

## Cron: expire payment sessions

Payment sessions expire after 5 minutes. Schedule one of:

**Option A — HTTP cron (recommended)**

Call every minute with secret header:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/cron/expire-sessions
```

This endpoint also expires stale merchant promotions (`expire_merchant_promotions`).

**Verify open crypto payments** (every 1–2 minutes):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/cron/verify-payments
```

**Stripe webhooks:** Configure Stripe dashboard → `POST /api/webhooks/stripe` with `STRIPE_WEBHOOK_SECRET`.

**Retry failed crypto settlements** (every 15 minutes):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/cron/retry-settlements
```

**Transactional email:** Set `RESEND_API_KEY` and `EMAIL_FROM` for invoice and payment notifications.

Use Netlify scheduled functions (see `netlify/functions/`), GitHub Actions, or Supabase Edge Function scheduler.

**Option A2 — Netlify scheduled functions (included in repo)**

Three functions in `netlify/functions/` call the Next.js cron API routes using `CRON_SECRET`:

| Function | Schedule | Endpoint |
|---|---|---|
| `cron-expire-sessions` | Every minute | `/api/cron/expire-sessions` |
| `cron-verify-payments` | Every 2 minutes | `/api/cron/verify-payments` |
| `cron-retry-settlements` | Every 15 minutes | `/api/cron/retry-settlements` |

Set `CRON_SECRET` in the Netlify dashboard. Functions use `URL` / `DEPLOY_PRIME_URL` automatically.

**Option B — pg_cron (Supabase Pro)**

Run `scripts/schedule-expire-sessions.sql` in SQL editor (uncomment pg_cron block).

## RLS audit

Run `scripts/rls-audit.sql` in Supabase SQL editor after migrations. Every public table must have RLS enabled.

## Monitoring

| Signal | Source |
|---|---|
| App errors | Sentry (`SENTRY_DSN`) |
| Uptime | `GET /api/health` |
| Failed settlements | Sentry + `audit_logs` (`settlement.failed`) |
| Payment volume | Admin → Analytics |

## Rollback

1. Revert deploy in Netlify to previous publish
2. Database migrations are forward-only — do not roll back SQL without a planned migration
3. If payment incident: disable new checkouts by suspending affected stores in admin

## Support contacts

- Platform support email: configure in Admin → Platform Fees
- Default: admin@nexarnetwork.org
