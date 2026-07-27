# Launch Runbook

Operational checklist for deploying Nexar Network to production.

## Pre-deploy

```bash
cp .env.production.example .env.local   # reference only — set vars in host dashboard
npm run prelaunch                        # typecheck + lint + build
```

Verify locally:
- `GET /api/health` returns `healthy` or documents `degraded` reasons
- Login, checkout, and payment popup work against staging Supabase

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

## Cron: expire payment sessions

Payment sessions expire after 5 minutes. Schedule one of:

**Option A — HTTP cron (recommended)**

Call every minute with secret header:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/cron/expire-sessions
```

Use Netlify scheduled functions, GitHub Actions, or Supabase Edge Function scheduler.

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
