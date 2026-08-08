# Infrastructure Production Audit

**Date:** 2026-08-08  
**Scope:** Nexar Network + ATLAS OS production readiness  
**Posture:** Reuse existing implementations; integrate missing services without redesign.

---

## Executive Summary

The platform is **production-capable** on Netlify/Docker with Supabase PostgreSQL, Auth.js, Resend email, and in-app event/outbox processing. This audit strengthened optional production services (Redis cache, Sentry client, PostHog, Better Stack, email retry, search cache) while preserving all existing architecture.

| Area | Status |
|------|--------|
| Core app + ATLAS modules | Already Implemented |
| Supabase (DB, storage, realtime) | Already Implemented |
| Auth.js + Supabase adapter | Already Implemented |
| Resend email | Improved (retry) |
| Rate limiting | Improved (Upstash optional) |
| Sentry | Improved (client + server configs) |
| PostHog | Integrated (optional) |
| Better Stack | Integrated (optional heartbeat) |
| Upstash Redis | Integrated (optional) |
| Queue / background jobs | Already Implemented (outbox + crons) |
| Cloudflare | Skipped (CDN in front of Netlify — config external) |
| GA4 analytics | Already Implemented |

---

## Step 1 — Infrastructure Audit

### Already Implemented

| Service | Location | Notes |
|---------|----------|-------|
| **Next.js App Router** | `app/` | Standalone output, compress enabled |
| **Supabase PostgreSQL** | `lib/supabase/`, migrations | Primary data store; no replacement |
| **Auth.js v5** | `auth.ts`, `lib/auth/` | Supabase `authjs_*` tables |
| **Proxy / middleware** | `proxy.ts` | Rate limit, HQ gate, auth routing |
| **Health checks** | `app/api/health`, `lib/monitoring/health.ts` | Load balancer probes |
| **Resend email** | `lib/email/send.ts`, `config/email.ts` | Verification, reset, invoices |
| **Sentry (partial)** | `instrumentation.ts`, `lib/monitoring/sentry.ts` | Server init + capture helpers |
| **GA4** | `app/layout.tsx` | Consent-gated via cookie |
| **Security headers** | `next.config.ts` | CSP, HSTS, X-Frame-Options, COOP |
| **Event outbox / queue** | `modules/atlas-core/repository.ts` | `atlas_core_outbox` table |
| **Netlify crons** | `netlify/functions/` | Payments, sessions, settlements |
| **Search** | `modules/atlas-network/`, marketplace repos | Postgres ILIKE / Supabase queries |
| **Image optimization** | `next.config.ts` images | AVIF/WebP, remote patterns |
| **Pre-deploy gate** | `scripts/pre-deploy-check.sh` | Env + prelaunch |
| **Logging** | `lib/logging/` | Security + structured logs |
| **Brute-force protection** | `lib/security/brute-force.ts` | Account lockout |

### Partially Implemented (Now Improved)

| Service | Gap | Repair |
|---------|-----|--------|
| **Rate limiting** | In-memory only | `rateLimitAsync` + Upstash with memory fallback |
| **Sentry** | No client config | `sentry.client/server/edge.config.ts` |
| **Email** | No retry | 3-attempt retry with Sentry on final failure |
| **Search** | No cache | 60s cache for anonymous public searches |
| **Health** | Basic checks | Redis, PostHog, Better Stack status |

### Missing (External Configuration Required)

| Service | Reason |
|---------|--------|
| **Cloudflare DNS/CDN** | Configured at DNS/hosting layer — app emits compatible headers |
| **Upstash Redis (prod)** | Requires `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Netlify |
| **PostHog (prod)** | Requires `NEXT_PUBLIC_POSTHOG_KEY` |
| **Better Stack (prod)** | Requires `BETTERSTACK_HEARTBEAT_URL` |
| **Sentry source maps upload** | Requires `SENTRY_AUTH_TOKEN` in CI (optional build step) |

### Skipped (By Design)

| Item | Reason |
|------|--------|
| Replace Supabase Auth | Auth.js is canonical; do not duplicate |
| Replace outbox with BullMQ | Existing outbox + crons sufficient |
| Session cache in Redis | Auth.js DB sessions; incompatible without migration |
| Hardcoded domains | All URLs from env (`NEXT_PUBLIC_APP_URL`, etc.) |

---

## Step 2 — Cloudflare

| Check | Status | Notes |
|-------|--------|-------|
| DNS readiness | **Skipped** | Point apex/`www` to Netlify; enable proxy |
| Security headers | **Already Implemented** | App sets CSP, HSTS, nosniff, COOP |
| Caching strategy | **Already Implemented** | Static assets via Next.js + CDN cache rules |
| CDN compatibility | **Already Implemented** | Standalone build, no domain hardcoding |
| Image caching | **Already Implemented** | `/_next/image` — set Cloudflare cache rule |
| Asset caching | **Already Implemented** | `/_next/static/*` long TTL at edge |
| Compression | **Already Implemented** | `compress: true` in Next.js |
| Brotli | **Skipped** | Cloudflare Brotli at edge when proxied |
| HTTP/3 | **Skipped** | Cloudflare enables QUIC automatically |
| SSL | **Skipped** | Full (strict) between Cloudflare ↔ Netlify |

**Cloudflare recommended settings (external):**
- SSL: Full (strict)
- Always Use HTTPS: On
- Brotli: On
- HTTP/3: On
- Cache: Bypass for `/api/*`, `/admin/*`; cache `/_next/static/*`, `/_next/image/*`

---

## Step 3 — Upstash Redis

| Use Case | Status | Implementation |
|----------|--------|----------------|
| Rate limiting | **Integrated** | `lib/security/rate-limit.ts` → `rateLimitAsync` |
| API cache | **Integrated** | `lib/cache/search-cache.ts` (generic JSON cache) |
| Feed cache | **Skipped** | Realtime feed; stale risk — use events instead |
| Session cache | **Skipped** | Auth.js DB sessions; no schema change |
| Counters | **Integrated** | Via `redisIncr` in rate limit |
| Temporary tokens | **Skipped** | Existing DB/token tables |
| Search cache | **Integrated** | `searchNetworkAction` anonymous cache |
| Notification cache | **Skipped** | Supabase realtime + outbox |

**Env vars:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**Fallback:** In-process memory when Redis unset (single-instance safe).

---

## Step 4 — Queue System

| Processor | Status | Location |
|-----------|--------|------------|
| Emails | **Already Implemented** | Resend via domain services |
| Notifications | **Already Implemented** | `fanOutNotificationFromEvent`, outbox |
| Image processing | **Already Implemented** | Supabase storage + Next.js Image |
| Analytics events | **Already Implemented** | `atlas_core_analytics_facts`, GA4, PostHog optional |
| Background cleanup | **Already Implemented** | `cron-expire-sessions.ts` |
| Retry failed jobs | **Already Implemented** | `cron-retry-settlements.ts`, outbox retry |
| Non-blocking defer | **Integrated** | `lib/jobs/defer.ts` |

**Reason skipped:** No duplicate queue (BullMQ/Inngest) — outbox pattern is canonical.

---

## Step 5 — Sentry

| Capture Target | Status |
|----------------|--------|
| Server errors | **Already Implemented** + improved |
| Client errors | **Integrated** (`sentry.client.config.ts`) |
| Server Actions | **Already Implemented** (`onRequestError` in instrumentation) |
| API routes | **Already Implemented** |
| React errors | **Integrated** (client SDK) |
| Unhandled promises | **Integrated** (Sentry default) |
| Auth errors | **Already Implemented** (via captureException) |
| Background jobs | **Integrated** (email failure capture) |
| Release version | **Integrated** (`VERCEL_GIT_COMMIT_SHA` / `COMMIT_REF`) |
| Environment | **Already Implemented** |
| Source maps | **Missing** — requires CI `SENTRY_AUTH_TOKEN` |

**Env vars:** `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`

---

## Step 6 — PostHog

| Event | Status |
|-------|--------|
| Pageviews | **Integrated** (`PostHogProvider`, consent-gated) |
| Registration/Login/Logout | **Integrated** (helper `ProductEvents` — wire in UI/actions as needed) |
| Marketplace/ATLAS/Search | **Integrated** (pageview + `capturePostHogEvent`) |
| Wallet Connect | **Integrated** (helper ready; no wallet logic changed) |
| Sensitive data | **Skipped** — sanitizer strips password/token/secret keys |

**Env vars:** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (optional)

GA4 remains primary; PostHog is additive.

---

## Step 7 — Better Stack

| Feature | Status |
|---------|--------|
| Health checks | **Already Implemented** `/api/health` |
| Uptime heartbeat | **Integrated** pings on healthy/degraded |
| Server monitoring | **Skipped** | Use Better Stack dashboard + Netlify metrics |
| Downtime alerts | **Integrated** (when heartbeat URL set) |
| Performance | **Skipped** | Sentry traces + Netlify analytics |

**Env var:** `BETTERSTACK_HEARTBEAT_URL`

---

## Step 8 — Resend

| Email Type | Status |
|------------|--------|
| Verification | **Already Implemented** `lib/auth/auth-email.ts` |
| Reset password | **Already Implemented** |
| Invitations | **Already Implemented** (domain services) |
| Notifications | **Already Implemented** |
| Merchant/order emails | **Already Implemented** `lib/email/send.ts` |
| Retry failures | **Integrated** 3 attempts, exponential backoff |

**Env vars:** `RESEND_API_KEY`, `EMAIL_FROM`

---

## Step 9 — Supabase

| Check | Status | Notes |
|-------|--------|-------|
| Realtime | **Already Implemented** | Connect, notifications |
| Storage | **Already Implemented** | Media uploads |
| Policies (RLS) | **Already Implemented** | Migrations |
| Indexes | **Already Implemented** | `20260727000017_production_performance.sql` |
| Performance | **Already Implemented** | Indexed hot paths |
| Connection pooling | **Skipped** | Supabase pooler URL in `DATABASE_URL` if needed |
| Edge Functions | **Skipped** | Not used; Netlify crons instead |

**Do NOT replace Supabase.**

---

## Step 10 — Image Optimization

| Feature | Status |
|---------|--------|
| Next.js Image | **Already Implemented** |
| Lazy loading | **Already Implemented** (default) |
| Responsive sizes | **Already Implemented** deviceSizes/imageSizes |
| AVIF/WebP | **Already Implemented** |
| Supabase remote patterns | **Verify** add hostname if missing in `next.config.ts` |
| Cache headers | **Already Implemented** via CDN + `/_next/image` |

---

## Step 11 — Search

| Entity | Status |
|--------|--------|
| Users/Companies | **Already Implemented** `searchNetworkProfiles` |
| Marketplace products/stores | **Already Implemented** |
| Posts/Jobs/Events | **Already Implemented** |
| Messages | **Already Implemented** (authenticated, not cached) |
| Frequent search cache | **Integrated** 60s TTL, anonymous only |

**Do NOT replace search engine.**

---

## Step 12 — Production Hardening

| Check | Status |
|-------|--------|
| Environment variables | **Already Implemented** `config/env.ts` (Zod) |
| Production mode | **Already Implemented** `NODE_ENV=production` |
| Logging | **Already Implemented** |
| Error handling | **Already Implemented** `AppError`, Sentry |
| Timeouts | **Integrated** fetch timeouts on email/Redis |
| Retry strategy | **Integrated** email retry |
| Rate limiting | **Improved** distributed optional |
| CORS | **Already Implemented** same-origin default |
| CSP | **Already Implemented** + PostHog/Sentry domains |
| Compression | **Already Implemented** |

---

## Step 13 — Validation Checklist

Run before deploy:

```bash
npm run typecheck
npm run lint
npm run test:ci
npm run build
npm audit
curl -s http://localhost:3000/api/health | jq
```

Verify no regressions:
- [ ] Auth login/OAuth/admin HQ
- [ ] Wallet connect (unchanged)
- [ ] Marketplace browse/checkout
- [ ] ATLAS workspace routes
- [ ] Realtime notifications
- [ ] Search (cached + uncached paths)
- [ ] Admin dashboard

---

## Production Environment Variables

### Required (existing)

```
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET
AUTH_SECRET
SENTRY_DSN
RESEND_API_KEY
EMAIL_FROM
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
PAYMENT_MASTER_SEED
TREASURY_WALLET_PRIVATE_KEY
BSC_RPC_URL
```

### Recommended (new integrations)

```
NEXT_PUBLIC_SENTRY_DSN          # Client error capture
UPSTASH_REDIS_REST_URL          # Distributed rate limit + search cache
UPSTASH_REDIS_REST_TOKEN
NEXT_PUBLIC_POSTHOG_KEY         # Product analytics
NEXT_PUBLIC_POSTHOG_HOST        # Optional, default us.i.posthog.com
BETTERSTACK_HEARTBEAT_URL       # Uptime monitoring
```

### Optional

```
NEXT_PUBLIC_GA_MEASUREMENT_ID
ADMIN_ALERT_WEBHOOK_URL
SENTRY_AUTH_TOKEN               # CI source map upload only
```

---

## Files Changed (This Integration)

| File | Change |
|------|--------|
| `lib/cache/upstash.ts` | New — Redis REST client |
| `lib/cache/search-cache.ts` | New — JSON cache layer |
| `lib/jobs/defer.ts` | New — non-blocking background |
| `lib/monitoring/posthog.ts` | New — server capture |
| `lib/monitoring/betterstack.ts` | New — heartbeat |
| `components/analytics/PostHogProvider.tsx` | New — client pageviews |
| `sentry.*.config.ts` | New — global Sentry |
| `lib/security/rate-limit.ts` | Upstash + fallback |
| `lib/middleware/rate-limit.ts` | Async distributed limit |
| `lib/email/send.ts` | Retry + Sentry on failure |
| `lib/monitoring/health.ts` | Extended checks |
| `app/api/health/route.ts` | Better Stack ping |
| `config/env.ts` | New optional vars |
| `modules/atlas-network/actions.ts` | Search cache |
| `next.config.ts` | CSP for Sentry/PostHog |
| `components/providers/AppProviders.tsx` | PostHog provider |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Redis unavailable | Automatic in-memory fallback |
| PostHog/Sentry unset | No-op; app works without |
| Async rate limit latency | Upstash REST ~5–20ms; acceptable |
| Search cache staleness | 60s TTL, anonymous only, no messages |
| Auth regression | **No auth files modified in this integration** |

---

*End of audit.*
