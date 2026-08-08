# Deployment Guide

## Targets

| Environment | Platform | Notes |
|-------------|----------|-------|
| Production | Netlify (primary) | `@netlify/plugin-nextjs`, cron via `netlify/functions` |
| Container | Docker | Standalone Next.js output, health check on `/api/health` |
| Database | Supabase PostgreSQL | Apply migrations before app deploy |

## Pre-Deployment Checklist

Run the automated gate:

```bash
export NODE_ENV=production
bash scripts/pre-deploy-check.sh
```

Required production environment variables:

- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `PAYMENT_MASTER_SEED`, `TREASURY_WALLET_PRIVATE_KEY` (server-only, never client)
- `BSC_RPC_URL`, `SENTRY_DSN`, `RESEND_API_KEY`, `EMAIL_FROM`
- Optional: `ADMIN_ALERT_WEBHOOK_URL` for operational alerts
- Optional: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` for distributed rate limiting
- Optional: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` for product analytics
- Optional: `BETTERSTACK_HEARTBEAT_URL` for uptime monitoring
- Optional: `NEXT_PUBLIC_SENTRY_DSN` for client-side error capture

## Netlify Deployment

1. Connect repository to Netlify.
2. Set build command: `npm run build`
3. Configure all secrets in Netlify environment UI (never commit `.env`).
4. Enable scheduled functions for payment verification and settlement retry.
5. Verify `GET /api/health` returns `healthy` or `degraded` (not `unhealthy`).

## Docker Deployment

```bash
docker compose build app
docker compose up -d app
curl -f http://localhost:3000/api/health
```

Provide secrets via `.env.production` referenced in `docker-compose.yml`.

## Database Migrations

```bash
supabase db push
# or apply migrations manually in order under supabase/migrations/
```

Migration `20260727000017_production_performance.sql` adds high-traffic indexes.

## Backups

Daily automated backup (cron or CI):

```bash
export SUPABASE_DB_URL='postgresql://...'
bash scripts/backup-database.sh
```

Backups are gzip SQL dumps retained 14 days under `backups/`.

## Recovery

1. Restore latest backup: `gunzip -c backups/nexar-db-*.sql.gz | psql $SUPABASE_DB_URL`
2. Re-run migrations if backup is older than schema
3. Redeploy application with matching env
4. Verify health, cron auth, and a test payment on staging

## Monitoring

- **Sentry**: errors and 5xx exceptions (`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`)
- **Health**: `/api/health` for load balancer probes
- **Better Stack**: optional uptime heartbeat via `BETTERSTACK_HEARTBEAT_URL`
- **PostHog**: optional product analytics via `NEXT_PUBLIC_POSTHOG_KEY`
- **Upstash Redis**: optional distributed cache/rate limit
- **Admin alerts**: treasury/payment failures via `ADMIN_ALERT_WEBHOOK_URL`
- **Audit logs**: `audit_logs` and `security_logs` tables

## Rollback

1. Revert Netlify deploy to previous publish
2. If schema changed, restore DB backup or run down migration
3. Confirm cron jobs and webhook endpoints match previous version

## Security Notes

- Treasury private key and payment seed exist only in server env
- Cron routes require `Authorization: Bearer $CRON_SECRET`
- CSP and HSTS configured in `next.config.ts`
- Rate limiting active on auth, API, and checkout routes
