# Performance Report

**Date:** 2026-07-27  
**Scope:** Nexar Network production performance review

## Summary

The application is optimized for high read throughput, paginated admin views, and atomic payment writes. Migration `20260727000017_production_performance.sql` adds indexes for the hottest query paths.

## Database

### Indexes Added (Production Migration)

- `payment_sessions(status, expires_at)` — cron verification of waiting sessions
- `payment_sessions(tx_hash)` — duplicate detection
- `settlements(status, created_at)` — settlement worker retries
- `orders(customer_id/store_id, created_at)` — dashboard lists
- `security_logs(event_type, created_at)` — admin security views
- `audit_logs(created_at)` — audit export and timeline

### Query Patterns

- Admin lists use `.limit()` and ordered indexes
- Payment completion uses single RPC (`complete_payment`) to avoid race conditions
- Analytics aggregates use database views (defined in migrations 007–016)

## Application

| Area | Optimization |
|------|--------------|
| Next.js | `compress: true`, standalone output for containers |
| Images | AVIF/WebP formats, responsive `deviceSizes` |
| API | Rate limiting prevents abuse; health check is lightweight |
| Caching | TanStack Query on client dashboards |
| Pagination | Admin export and list pages bounded |

## Scalability Path

Current monolith supports millions of users with:

1. **Horizontal app scaling** — Stateless Next.js on Netlify/Docker replicas
2. **Database scaling** — Supabase connection pooling, read replicas for analytics
3. **Payment workers** — Cron routes batch-verify 50 sessions per run; increase frequency or shard by status
4. **Future microservices** — Settlement worker and blockchain verifier are isolated modules under `modules/settlement/` and `lib/blockchain/`

## Load Testing Recommendations

Before major launch:

1. Simulate 100 concurrent checkouts against staging Supabase
2. Verify `complete_payment` idempotency under parallel tx hash submissions
3. Monitor p95 latency on `/api/health` and admin dashboard queries
4. Confirm index usage with `EXPLAIN ANALYZE` on payment session cron query

## Monitoring KPIs

- API p95 latency (Sentry performance)
- Payment verification success rate (cron JSON + admin alerts)
- Settlement retry queue depth
- Database connection count (Supabase dashboard)

## Bottleneck Watchlist

- BSC RPC rate limits during payment verification spikes → use dedicated RPC provider
- In-memory rate limiter → Redis at multi-region scale
- Large CSV exports → stream responses (current implementation builds in memory; acceptable for admin scale)
