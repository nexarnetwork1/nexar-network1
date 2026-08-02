# CSRF protection model

Nexar Network has two kinds of mutating endpoints, and each is protected by a
different mechanism. This document records which applies where so future work
does not add a redundant third layer.

## 1. Server Actions — protected by the framework

Every `"use server"` action in `modules/**` and every inline form action in
`app/**` is a Next.js Server Action. Next.js compares the `Origin` header
against the `Host` header on each action POST and rejects mismatches with a 403
before the action body runs. No application-level token is needed.

This covers the large majority of state changes in the platform, including
checkout, catalog edits, dispute handling, withdrawals, escrow release,
verification decisions and all admin platform settings.

If the app is ever served behind a proxy that rewrites `Host`, configure
`experimental.serverActions.allowedOrigins` in `next.config.ts`. It is
intentionally unset today because the deployment terminates on its own host.

## 2. Route handlers — protected by an explicit origin check

Route handlers (`app/api/**/route.ts`) receive no framework CSRF handling. Any
mutating handler that authenticates with an ambient cookie therefore calls
`assertSameOrigin()` from `lib/security/origin-check.ts` first:

| Route | Method | Reason |
| --- | --- | --- |
| `/api/admin/wallet/challenge` | POST | Writes a challenge row |
| `/api/admin/wallet/verify` | POST | Issues the super admin session cookie |
| `/api/admin/wallet/logout` | POST | Clears the super admin session cookie |
| `/api/admin/wallet/connected` | POST | Writes an audit record |
| `/api/commerce/v1/brands/[brandId]/approve` | POST | Cookie-authenticated admin mutation |
| `/api/commerce/v1/analytics/events` | POST | Writes analytics rows, optional session |
| `/api/assistant/stream` | POST | Consumes a per-IP AI budget |

Browsers have attached `Origin` to every POST since 2020, so a same-site caller
always passes and a cross-site caller always fails. Requests with no origin
information at all (server-to-server) are allowed, since they cannot ride on a
victim's cookies.

## 3. Endpoints deliberately excluded

| Endpoint | Why no CSRF check |
| --- | --- |
| `/api/webhooks/stripe` | Cross-origin by design; authenticated by `stripe-signature` against `STRIPE_WEBHOOK_SECRET` |
| `/api/cron/*` | `Authorization: Bearer ${CRON_SECRET}`, no cookie involved |
| `GET` handlers | Not state-changing; admin exports additionally require a super admin session |

## 4. The double-submit token helper

`lib/security/csrf.ts`, `lib/api/csrf-guard.ts`, `hooks/useCsrf.ts` and
`GET /api/csrf` implement a double-submit cookie token. They are retained for
backward compatibility and for any future endpoint that needs a token in
addition to the origin check, but they are not the primary defence — the origin
check is, because it requires no client changes and cannot be forgotten by a
caller.
