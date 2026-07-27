# Production Security Checklist

## Authentication
- [ ] Supabase Auth: email confirmation enabled in production
- [ ] Google OAuth configured with production redirect URLs
- [ ] Apple Sign In configured with production redirect URLs
- [ ] JWT expiry set appropriately (default 3600s)
- [ ] Roles stored in `profiles.role` + `app_metadata`, never `user_metadata`

## Database
- [ ] RLS enabled on every public table (`scripts/rls-audit.sql`)
- [ ] No unsafe `security definer` functions exposed to anon/authenticated roles
- [ ] Service role key never exposed to client (`NEXT_PUBLIC_*`)
- [ ] Migrations applied: `supabase db push`

## Payments
- [ ] `PAYMENT_MASTER_SEED` set (server-only, cryptographically random)
- [ ] Treasury wallet configured in admin → Platform Fees
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set for settlement worker
- [ ] BSC RPC URL configured (dedicated node recommended for production)
- [ ] Exchange rates updated before launch
- [ ] Cron scheduled: `GET /api/cron/expire-sessions` every minute

## Infrastructure
- [ ] All env vars from `.env.example` configured in hosting provider
- [ ] `SENTRY_DSN` configured for error monitoring
- [ ] `CRON_SECRET` set for cron endpoint authorization
- [ ] Health check monitored: `GET /api/health`
- [ ] HTTPS enforced (HSTS header in next.config.ts)
- [ ] CSP headers reviewed (no external QR dependency)

## Application (verified in codebase)
- [x] Rate limiting on auth, API, and webhook routes (middleware)
- [x] CSRF utilities available (`lib/security/csrf.ts`)
- [x] Input validation via Zod on server actions
- [x] No public invoice or payment pages (RLS-scoped)
- [x] Audit logs on checkout, payment, and admin mutations
- [x] Global error boundary with Sentry reporting
- [x] Local QR generation (no third-party QR API)

## Operational
- [ ] Admin user promoted and tested
- [ ] Failed settlement alerting via Sentry
- [ ] Backup strategy for Supabase database
- [ ] Support email configured
- [ ] Launch runbook reviewed: `docs/launch-runbook.md`

## Penetration testing focus areas
1. Attempt to access another user's orders/invoices via ID enumeration
2. Attempt to modify platform fee from client-side
3. Attempt to replay crypto transaction hash
4. Attempt privilege escalation via profile role update
5. Verify webhook endpoint rejects invalid Stripe signatures
6. Verify cron endpoint rejects requests without `CRON_SECRET`
