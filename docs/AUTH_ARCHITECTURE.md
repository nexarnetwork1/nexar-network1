# ATLAS Auth Architecture

**Nexar Network — canonical identity system**  
**Last updated:** August 2026

---

## Overview

ATLAS Auth is the **single identity system** for the entire Nexar Network ecosystem. One account unlocks ATLAS, Marketplace, Business Hub, Network, and future modules.

```
User → ATLAS Auth → ATLAS User → Profile / Business / Marketplace Seller (optional)
```

There are **no separate** customer, merchant, marketplace, or website login systems.

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 App Router |
| OAuth + sessions | Auth.js v5 (`next-auth@5`) |
| Credentials | bcrypt + server actions |
| Database | Supabase Postgres via service role |
| Session store | `authjs_sessions` (database strategy) |
| Wallet | Privy + wagmi + SIWE signature verification |
| Human verification | Cloudflare Turnstile (optional in dev) |
| Edge protection | `proxy.ts` + `lib/middleware/auth.ts` |

---

## Canonical routes

| Route | Purpose |
|-------|---------|
| `/login` | Unified ATLAS sign-in / register page + global modal |
| `/forgot-password` | Password reset request |
| `/reset-password` | Password reset with token |
| `/verify-email` | Email verification gate |
| `/auth/callback` | Post-OAuth app landing (session must exist) |
| `/auth/verify` | Email verification token consumer |
| `/auth/complete-profile` | First-time profile completion |
| `/admin/login` | HQ admin entry (separate authorization) |

**OAuth provider callbacks (Auth.js):**

- `https://www.nexarnetwork.org/api/auth/callback/google`
- `https://www.nexarnetwork.org/api/auth/callback/github`
- Local: `http://localhost:3000/api/auth/callback/{provider}`

Legacy routes (`/signup`, `/register/*`, `/customer/login`, `/merchant/login`) redirect to `/login` via `next.config.ts`.

---

## Module layout

```
modules/atlas-auth/          # Canonical auth module boundary
components/atlas/auth/       # Auth UI shell + Turnstile + wallet panel
components/atlas/identity/   # ATLAS identity card (only universal auth UI)
```

---

## Data model

- `authjs_*` — Auth.js sessions and OAuth
- `profiles` — FK to `authjs_users.id`
- `wallet_connections` — verified public addresses only
- `wallet_auth_nonces` — SIWE challenges
- `security_events` — auth audit metadata

**Never stored:** private keys, seed phrases, OAuth secrets.

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | Auth.js signing |
| `AUTH_URL` | Canonical URL |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Human verification |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Wallet connect |

See `config/env.ts` for the full schema.
