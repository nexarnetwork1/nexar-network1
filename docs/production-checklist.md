# Production Checklist

Use this checklist before every production release.

## Security

- [ ] All routes under `/admin`, `/merchant`, `/customer` protected by middleware
- [ ] All API routes validated (cron secret, CSRF on mutations, role checks on admin export)
- [ ] No hardcoded secrets in repository (`scripts/security-audit.sh`)
- [ ] `TREASURY_WALLET_PRIVATE_KEY` and `PAYMENT_MASTER_SEED` server-only
- [ ] CSP, HSTS, X-Frame-Options, nosniff headers enabled
- [ ] CSRF tokens on state-changing forms
- [ ] Rate limiting on auth, API, checkout
- [ ] Brute-force lockout on login (5 attempts / 15 min, 30 min lockout)
- [ ] SSRF protection on admin alert webhooks
- [ ] Production 500 errors sanitized (no stack traces to clients)
- [ ] RLS enabled on all tables (`scripts/rls-audit.sql`)

## Payments & Treasury

- [ ] `complete_payment()` RPC tested on staging
- [ ] Platform fee transfer to treasury verified
- [ ] Merchant settlement transfer verified
- [ ] Duplicate tx hash rejection verified
- [ ] Expired session handling verified
- [ ] Cron verify-payments and retry-settlements authenticated
- [ ] Stripe webhook signature validation enabled

## Audit & Logging

- [ ] Sensitive admin actions write to `audit_logs` with IP, user agent, country
- [ ] Failed logins write to `security_logs`
- [ ] Payment, treasury, blockchain, auth loggers active
- [ ] Sentry DSN configured for production

## Database

- [ ] All migrations applied including performance indexes
- [ ] Foreign keys intact (`validate_database_schema()`)
- [ ] Backup job scheduled (`scripts/backup-database.sh`)
- [ ] Recovery procedure documented and tested

## Quality Gates

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test:ci` passes
- [ ] `npm run build` succeeds
- [ ] E2E smoke tests pass
- [ ] No debug mode (`NODE_ENV=production`)
- [ ] No stray `console.log` in production paths (logger used instead)

## DevOps

- [ ] Environment variables set in hosting provider
- [ ] Health check `/api/health` wired to monitor
- [ ] Admin alert webhook configured (optional)
- [ ] CI pipeline green on target commit
- [ ] Disaster recovery runbook reviewed (`docs/deployment.md`)

## Post-Deploy Verification

- [ ] Homepage and login load
- [ ] Health endpoint returns expected status
- [ ] Test customer checkout (staging amount)
- [ ] Admin dashboard loads for admin role
- [ ] Export CSV works for admin
- [ ] Cron endpoints reject unauthorized calls
