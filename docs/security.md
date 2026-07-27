# Nexar Network — Security Plan

## Defense in Depth

| Layer | Implementation |
|---|---|
| RLS | Every public table; policies per role tested |
| RBAC | Middleware + server action guards + RLS |
| JWT | `@supabase/ssr`; server uses `getUser()` not `getSession()` alone |
| Role storage | `profiles.role` + `app_metadata.role`; never `user_metadata` |
| CSRF | Double-submit cookie on mutating server actions |
| XSS | React escaping, CSP headers, sanitize user-generated content |
| SQL injection | Parameterized Supabase queries only |
| Rate limiting | Auth 5/min, checkout 10/min, API 100/min |
| Input validation | Zod at every server action boundary |
| Secure headers | CSP, HSTS, X-Frame-Options, Referrer-Policy (next.config.ts) |
| Secrets | Vault for treasury keys; service role server-only |
| Audit | Append-only logs; no client DELETE/UPDATE |
| Webhooks | Stripe signature verification with timestamp tolerance |

## Treasury Wallet

- Address stored in `platform_settings.treasury_wallet_address` (admin-configurable)
- Private key in Supabase Vault; accessible only to settlement Edge Functions
- Never hardcoded in source or exposed via `NEXT_PUBLIC_*` env vars
- Admin UI can update address; never displays private key

## Threat Mitigations

| Threat | Mitigation |
|---|---|
| Client-side fee manipulation | Fee computed server-side only |
| Merchant wallet change mid-payment | Wallet snapshot on order creation |
| Crypto tx replay | Unique tx hash constraint + confirmation depth |
| Invoice enumeration | UUIDs + RLS; no public invoice routes |
| Privilege escalation | Admin role assign via service role only |
| OAuth profile bypass | Middleware redirect until profile completed |

## Session Security

- Short JWT expiry with refresh rotation
- Sign out on role change
- Sensitive operations re-validate `getUser()`

## Storage

- Merchant logos and product images in Supabase Storage
- MIME type validation on upload
- RLS policies: merchant owns store bucket path
