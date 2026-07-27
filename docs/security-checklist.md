# Production Security Checklist

## Authentication
- [ ] Supabase Auth: email confirmation enabled in production
- [ ] Google OAuth configured with production redirect URLs
- [ ] Apple Sign In configured with production redirect URLs
- [ ] JWT expiry set appropriately (default 3600s)
- [ ] Roles stored in `profiles.role` + `app_metadata`, never `user_metadata`

## Database
- [ ] RLS enabled on every public table (`scripts/rls-audit.sql`)
- [ ] No `security definer` functions in public schema
- [ ] Service role key never exposed to client (`NEXT_PUBLIC_*`)
- [ ] Migrations applied: `supabase db push`

## Payments
- [ ] `PAYMENT_MASTER_SEED` set (server-only, cryptographically random)
- [ ] Treasury wallet configured in admin → Platform Fees
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set for settlement worker
- [ ] BSC RPC URL configured (dedicated node recommended for production)
- [ ] Exchange rates updated before launch

## Infrastructure
- [ ] All env vars from `.env.example` configured in hosting provider
- [ ] `SENTRY_DSN` configured for error monitoring
- [ ] Health check monitored: `GET /api/health`
- [ ] HTTPS enforced (HSTS header in next.config.ts)
- [ ] CSP headers reviewed

## Application
- [ ] Rate limiting active on auth and API routes (middleware)
- [ ] CSRF protection on mutating server actions
- [ ] Input validation via Zod on all server actions
- [ ] No public invoice or payment pages
- [ ] Audit logs writing on checkout and payment events

## Operational
- [ ] Admin user promoted and tested
- [ ] Cron scheduled: `expire_stale_payment_sessions()` every minute
- [ ] Failed settlement alerting via Sentry
- [ ] Backup strategy for Supabase database
- [ ] Support email: admin@nexarnetwork.org

## Penetration testing focus areas
1. Attempt to access another user's orders/invoices via ID enumeration
2. Attempt to modify platform fee from client-side
3. Attempt to replay crypto transaction hash
4. Attempt privilege escalation via profile role update
5. Verify webhook endpoint rejects invalid Stripe signatures
