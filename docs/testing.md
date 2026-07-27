# Testing Strategy

Nexar Network uses a layered testing pyramid optimized for fintech payment safety.

## Layers

| Layer | Tool | Location | Scope |
|-------|------|----------|-------|
| Unit | Vitest | `tests/unit/**` | Pure functions, validators, security utilities |
| Integration | Vitest | `tests/integration/**` | Health checks, auth rules, payment guard logic |
| E2E | Playwright | `tests/e2e/**` | Public pages, API protection, smoke flows |
| Database | SQL scripts | `scripts/validate-database.sql`, `scripts/rls-audit.sql` | Schema, RLS, RPC integrity |

## Commands

```bash
npm run test          # watch mode
npm run test:ci       # CI unit + integration
npm run test:coverage # coverage report
npm run test:e2e      # Playwright (starts dev server locally)
npm run test:e2e:ci   # Playwright in CI against built app
npm run security:audit
```

## Coverage Areas

### Authentication & Authorization
- Login/register validators (`tests/integration/auth/validators.test.ts`)
- Role route guards (`tests/integration/auth/authorization.test.ts`)
- Brute-force lockout (`tests/unit/security/brute-force.test.ts`)
- Cron bearer auth (`tests/unit/security/cron-auth.test.ts`)

### Payments
- Amount tolerance, currency match, expiry, duplicates (`tests/integration/payments/payment-scenarios.test.ts`)
- Fee split and USD→crypto conversion (`tests/unit/settlement/fee-calculator.test.ts`)

### Security
- XSS sanitization, SQL injection detection, SSRF blocking, rate limiting

### API
- Health endpoint structure (`tests/integration/api/health.test.ts`)
- Cron/admin protection (`tests/e2e/smoke.spec.ts`)

### Audit
- Request IP, country, browser extraction (`tests/integration/audit/request-context.test.ts`)

## CI Pipeline

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR:

1. Type check
2. ESLint
3. Vitest (unit + integration)
4. npm security audit
5. Production build
6. Playwright E2E (Chromium)

## Environment for Tests

Tests set `SKIP_ENV_VALIDATION=true` and mock Supabase/Sentry where needed. No live blockchain or payment keys are required for the default suite.

## Manual Pre-Launch Checks

Before production deployment:

```bash
bash scripts/pre-deploy-check.sh
bash scripts/backup-database.sh   # requires SUPABASE_DB_URL
psql $SUPABASE_DB_URL -f scripts/validate-database.sql
psql $SUPABASE_DB_URL -f scripts/rls-audit.sql
```

## Adding Tests

- Place pure logic tests under `tests/unit/` mirroring source paths.
- Use integration tests when module wiring or env config matters.
- Add E2E specs only for user-visible or HTTP contract regressions.
- Never commit secrets; use `tests/setup.ts` defaults.
