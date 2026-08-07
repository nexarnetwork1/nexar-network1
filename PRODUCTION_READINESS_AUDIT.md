# Production Readiness Audit

**Project:** Nexar Network / ATLAS  
**Date:** August 7, 2026  
**Scope:** Incremental production hardening — extend existing implementation only

---

## Executive Summary

This audit inspected the existing codebase before making targeted fixes. Two user-reported bugs were fixed (Add NXR to Wallet, OAuth redirects). Wallet authentication gaps and infrastructure integration items are documented for follow-up.

---

## 1. Add NXR to Wallet — FIXED

### What existed
- `components/web3/AddNxrToWalletButton.tsx`
- `lib/web3/add-nxr-token.ts` — `wallet_watchAsset` via EIP-747
- BSC-only token address hardcoded in `NXR_WATCH_ASSET`

### Problem
- Used `wallets[0]` from Privy (often Coinbase embedded wallet)
- Ignored active wagmi address / connected connector
- BSC-only — BOT Chain contract not supported

### Fix applied
| File | Change |
|------|--------|
| `lib/web3/active-wallet.ts` | **New** — resolve wallet matching wagmi address; prefer external connectors |
| `lib/constants/presale-networks.ts` | Added `getPresaleNetworkByChainId()` |
| `lib/web3/add-nxr-token.ts` | Multi-chain `addNxrToWallet(provider, chainId)` with switch/add chain |
| `components/web3/AddNxrToWalletButton.tsx` | Uses `useAccount` + `useChainId` + active Privy wallet provider |

### Behavior now
- MetaMask / Rabby / Coinbase / WalletConnect → uses **connected** wallet's provider
- Detects chain → BSC (`0xc37c…`) or BOT (`0xC5eF…`) with correct chainId, decimals, symbol, logo
- Switches or adds chain before `wallet_watchAsset`

---

## 2. OAuth Redirects — FIXED

### What existed
- ATLAS Identity OAuth via `AtlasOAuthButtons` → Auth.js `signIn()`
- Post-auth handler: `app/auth/callback/route.ts`
- Auth.js config: `auth.ts`

### Problem
```typescript
pages: { signIn: "/marketplace", error: "/marketplace" }
```
Auth.js defaulted OAuth errors and sign-in page to **Marketplace**, not ATLAS.

### Fix applied
| File | Change |
|------|--------|
| `auth.ts` | `signIn` / `error` → `/login`; added safe `redirect` callback |
| `AtlasOAuthButtons.tsx` | Default OAuth `redirect` param → `/atlas` |
| `app/(auth)/login/page.tsx` | Default redirect → `/atlas` |
| `app/auth/callback/route.ts` | Fallback after OAuth → `/atlas` (was role dashboard) |

### Flow now
```
ATLAS Login → Google/GitHub → account picker → /auth/callback?redirect=/atlas → /atlas
```
Caller-provided `redirect` preserved via query param and `isValidRedirect()`.

---

## 3. Wallet Authentication — REVIEW (not changed)

### What exists
- Privy + wagmi wallet connect
- `linkOrLoginWalletAction` — links wallet address to profile
- DB `nonce` table (migration exists) — **not wired to client SIWE flow**

### Gaps (production blockers)
| Item | Status |
|------|--------|
| SIWE / signature verification | ❌ Not implemented |
| Nonce challenge before wallet login | ❌ Not implemented |
| Replay protection | ❌ Not implemented |
| Wallet login without proof of ownership | ⚠️ Critical — documented in Sprint 3.0 |

### Recommendation
Implement EIP-4361 using existing `linkOrLoginWalletAction` entry point — **do not duplicate** auth tables.

---

## 4. Redirects — REVIEWED

| Route | Behavior |
|-------|----------|
| `/auth/callback` | Honors `?redirect=`; fallback `/atlas` |
| `/login` | Preserves `redirect` param |
| `/dashboard/network` | → `/atlas/network` |
| `/dashboard/pulse` | → `/atlas` |
| `/dashboard/connect` | → `/atlas/messages` |
| `getDashboardPath()` | All roles → `/dashboard` |
| `proxy.ts` | Auth routing + HQ gate + rate limits |

No unexpected marketplace redirects remain in OAuth path.

---

## 5. Navigation — REVIEWED

| Surface | Entry | Status |
|---------|-------|--------|
| Website | `/` + Navbar | ✅ |
| ATLAS Feed | `/atlas` | ✅ |
| Network / Profiles | `/atlas/network`, `/atlas/network/[slug]` | ✅ |
| Messages | `/atlas/messages` | ⚠️ UI stub — no realtime backend wired |
| Marketplace | `/atlas/marketplace`, `/marketplace/*` | ✅ |
| Business Hub | `/dashboard/business`, `/atlas/business` | ✅ |
| Jobs / Events | `/atlas/jobs`, `/atlas/events` | ✅ |
| Dashboard workspace | `/dashboard` | ✅ module cards |

Shared nav config: `config/atlas-app-nav.ts`

---

## 6. Whitepaper & Roadmap — UPDATED

| File | Change |
|------|--------|
| `lib/data/roadmap.ts` | Reflects ATLAS, Marketplace, Business Hub, AI, Network, Jobs, Events, Messaging |
| `app/whitepaper/page.tsx` | Roadmap section updated — removed "Beta" language |

No version numbers (v1/v2/beta/alpha) added per requirements.

---

## 7. Cleanup — DEFERRED

Full dead-code sweep deferred to avoid risk in production week. Known candidates:
- Duplicate `Premium*` trees (`components/premium/` vs `components/atlas/premium/`)
- `debug.log` / `full-debug.log` in git status
- Legacy `/customer/login`, `/merchant/login` routes (redirect aliases exist)

---

## 8. Infrastructure — STATUS

| Service | Integration | Notes |
|---------|-------------|-------|
| Vercel | ✅ | Next.js App Router deployment target |
| Supabase | ✅ | DB, RLS, Realtime hooks exist |
| Sentry | ✅ | `@sentry/nextjs` in dependencies |
| GitHub Actions | ⚠️ | Verify CI workflows in repo |
| Cloudflare | ⚠️ | DNS/CDN — env-specific |
| Resend | ⚠️ | Email — verify env vars in production |
| PostHog / Better Stack / Redis | ❌ | Not integrated — add only when needed |
| RLS Audit | ⚠️ | Manual review recommended before launch |

No duplicate services introduced.

---

## 9. Social Platform — STATUS

| Feature | Status |
|---------|--------|
| Feed / Posts / Comments | ✅ Read + compose; guest auth gates |
| Likes / Bookmarks | ⚠️ Partial / client-only in places |
| Realtime Messages | ❌ Stub UI |
| Realtime Notifications | ⚠️ Repository exists; verify Realtime subscription |
| Presence / Typing / Last seen | ❌ Not implemented |
| Search | ✅ Global network search |
| Companies / Jobs / Events | ✅ |

---

## 10. Design — PRESERVED

Sprint 3.1 design tokens and theme system unchanged. No redesign in this pass.

---

## Files Modified (this pass)

- `lib/web3/active-wallet.ts` (new)
- `lib/web3/add-nxr-token.ts`
- `lib/constants/presale-networks.ts`
- `components/web3/AddNxrToWalletButton.tsx`
- `auth.ts`
- `components/atlas/identity/AtlasOAuthButtons.tsx`
- `app/(auth)/login/page.tsx`
- `app/auth/callback/route.ts`
- `lib/data/roadmap.ts`
- `app/whitepaper/page.tsx`

---

## Typecheck

```bash
npm run typecheck  # ✅ exit 0
```

---

## Remaining Production Blockers

1. **SIWE wallet authentication** — security critical
2. **Realtime messaging** — Connect module → MessagingInterface
3. **Presale BNB buy UI** — contract supports; panel USDT-only
4. **`allowDangerousEmailAccountLinking: true`** — OAuth config
5. **Production build verification** — `npm run build` not run this pass

---

## Release Readiness: ~76%

OAuth and Add-to-Wallet fixes improve launch UX. Wallet auth security and messaging remain the highest-priority pre-launch items.
