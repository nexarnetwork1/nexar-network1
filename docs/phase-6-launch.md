# Phase 6 — Hardening & Launch

## Completed in codebase

- **Sentry** — `instrumentation.ts` + `lib/monitoring/sentry.ts` (set `SENTRY_DSN`)
- **Global error boundary** — `app/global-error.tsx`
- **Rate limiting** — middleware limits on auth, API, and webhook routes
- **Health check** — `GET /api/health` with Supabase, payments, and monitoring checks
- **Cron endpoint** — `GET /api/cron/expire-sessions` (Bearer `CRON_SECRET`)
- **Netlify scheduled crons** — `netlify/functions/cron-*.ts` (expire, verify, retry settlements)
- **CSP** — no external QR API dependency (local `qrcode.react`)
- **Netlify** — `@netlify/plugin-nextjs` configured in `netlify.toml`
- **RLS audit script** — `scripts/rls-audit.sql`
- **Session expiry SQL** — `scripts/schedule-expire-sessions.sql`
- **Security checklist** — `docs/security-checklist.md` (updated)
- **Launch runbook** — `docs/launch-runbook.md`
- **Prelaunch script** — `npm run prelaunch` (typecheck + lint + build)

## Production deployment

### 1. Supabase

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Configure Auth providers and redirect URLs for production domain.

### 2. Environment variables

Set all variables from `.env.example` in Netlify/Vercel dashboard.

Critical:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYMENT_MASTER_SEED`
- `TREASURY_WALLET_ADDRESS`
- `BSC_RPC_URL`
- `SENTRY_DSN`
- `CRON_SECRET`

### 3. Netlify

```bash
npm install @netlify/plugin-nextjs --save-dev
npm run build
```

Deploy via Netlify with `netlify.toml` configuration.

### 4. Post-deploy

1. Run RLS audit: `scripts/rls-audit.sql` in Supabase SQL editor
2. Promote admin user
3. Configure treasury wallet in admin UI
4. Activate test merchant store
5. Run end-to-end payment test on BSC testnet or mainnet
6. Monitor `/api/health` and Sentry dashboard
7. Schedule cron: `GET /api/cron/expire-sessions` every minute (see `docs/launch-runbook.md`)

## Load testing (manual)

Test checkout flow under concurrent users:
1. Multiple customers add to cart simultaneously
2. Checkout creates orders without stock oversell (DB locks verify this)
3. Payment sessions expire after 5 minutes
4. Concurrent payment verification does not double-settle (session status lock)

## Architecture complete

All 6 phases implemented:
- Phase 0: Foundation
- Phase 1: Auth & Users
- Phase 2: Merchant & Catalog
- Phase 3: Orders & Invoices
- Phase 4: Payments Core
- Phase 5: Admin & Platform
- Phase 6: Hardening & Launch
