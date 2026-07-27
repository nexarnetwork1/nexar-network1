# Production Blocker Sprint Report

**Date:** 2026-07-28  
**Branch:** `cursor/remove-business-hub`

## Fixed Issues

### 1. Marketplace Login & Register
- **Root cause:** Auth cards used `max-w-md`/`max-w-lg` with heavy padding; auth layout used lightweight gradient only (no global neon background).
- **Fix:** Reduced `AuthCard` to `max-w-[22rem]` with compact padding/typography; auth layout vertically centers forms; global `GlobalBackground` now provides neon grid + particles on every page including all auth routes.

### 2. Google / Apple Login
- **Root cause:** OAuth buttons always rendered with no runtime provider check; misconfigured Supabase providers caused opaque failures.
- **Fix:** Added `NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED` / `NEXT_PUBLIC_OAUTH_APPLE_ENABLED` env flags; disabled buttons show **"Provider not configured."**; errors surfaced inline; banner when no providers enabled.

### 3. Customer Register
- **Root cause:** When Supabase email confirmation is required (`!data.session`), profile update (name, wallet, role) was skipped — users re-entered data on complete-profile.
- **Fix:** `persistCustomerProfile()` uses service-role client to save profile immediately after signup, including email-confirmation path. Signup metadata includes wallet + role.

### 4. Merchant Register
- **Root cause:** Same email-confirmation gap; store insert skipped; slug collisions possible.
- **Fix:** `persistMerchantRegistration()` creates profile + store via admin client on email-confirm path; unique slug resolution with collision handling; signup metadata stores merchant fields.

### 5. Hero Section
- **Root cause:** Hero still showed Connect Wallet + Whitepaper instead of required CTAs.
- **Fix:** Removed `ConnectWalletButton` from hero. Kept **Buy NXR** + **Learn More** (`/#about`).

### 6. Remove Presale from Navbar
- **Fix:** Removed Presale from `NAV_ITEMS` and `FOOTER_LINKS.quick`.

### 7. Buy NXR Button
- **Root cause:** Button disabled during presale loading/error states, blocking navigation.
- **Fix:** Button always navigates to `/presale` regardless of contract read state.

### 8. Presale Page Loading
- **Root cause:** Wagmi used default public RPC (ignored `NEXT_PUBLIC_BSC_RPC_URL`); status machine blocked on `useBlock` timestamp; 20s timeout felt infinite.
- **Fix:** Wired fallback RPC transport; status resolves once contract reads complete using wall-clock fallback when block unavailable; timeout reduced to 10s with error state.

### 9. Global Background
- **Root cause:** Full `BackgroundEffect` commented out in root layout; only some pages had `PageAmbientBackground`.
- **Fix:** Created `GlobalBackground` (BackgroundEffect + variant gradients) enabled in root `app/layout.tsx`.

### 10. Marketplace Hero Spacing
- **Root cause:** Stores hero section lacked `nav-offset`, content sat under fixed navbar.
- **Fix:** Added `nav-offset` to marketplace stores hero container.

### 11. Auth Forms
- **Fix:** Compact inputs (`py-2.5`), tighter form spacing (`space-y-3`), smaller auth card typography.

### 12–13. Mobile Menu & Global Scroll Lock
- **Root cause:** No body scroll lock utility; background remained scrollable behind mobile menu and modals.
- **Fix:** Added `useScrollLock` hook with ref-counting; applied to MobileMenu, ClaimNxrModal, PaymentPopup, CardPaymentPopup.

### 14. Error Pages
- **Root cause:** Only `global-error.tsx` existed; generic copy with minimal actions.
- **Fix:** Added `app/error.tsx` and `app/not-found.tsx`; upgraded `global-error.tsx` with retry, reload, return home, error logging.

### 15. Global Routing
- **Fix:** Added `/customer/login` → `/login?redirect=/customer` and `/merchant/login` → `/login?redirect=/merchant`; `/admin/login` now shows wallet-based admin access UI with shared background.

---

## Remaining Blockers (pre-existing, not in this sprint scope)

| Blocker | Status |
|---------|--------|
| CSRF tokens generated but not enforced | Open |
| BTC/ETH branded but not executable at checkout | Open |
| Live presale buy/claim QA (opens 2026-08-01) | Pending on-chain window |
| Escrow auto-release cron | Open |
| ERC20 settlement gas funding | Open |
| Maintenance mode not enforced in middleware | Open |
| Production build CI confirmation | Pending |

---

## Env Vars Required

```bash
# OAuth (set to "true" when configured in Supabase)
NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED=true
NEXT_PUBLIC_OAUTH_APPLE_ENABLED=true

# Presale RPC (recommended for reliable contract reads)
NEXT_PUBLIC_BSC_RPC_URL=https://bsc-dataseed.binance.org

# Registration email-confirm path requires:
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Files Modified

| Area | Files |
|------|-------|
| Global background | `components/ui/GlobalBackground.tsx`, `app/layout.tsx`, `app/page.tsx`, `app/presale/page.tsx`, `app/marketplace/stores/page.tsx` |
| Auth UI | `components/auth/AuthCard.tsx`, `components/auth/OAuthButtons.tsx`, `app/(auth)/layout.tsx`, `app/auth/layout.tsx`, login/register forms |
| Auth routes | `app/(auth)/customer/login/page.tsx`, `app/(auth)/merchant/login/page.tsx`, `app/admin/(auth)/login/page.tsx` |
| Registration | `modules/auth/actions.ts` |
| OAuth config | `lib/auth/oauth-providers.ts`, `config/env.ts`, `config/auth.ts` |
| Navigation / Hero | `lib/constants/navigation.ts`, `components/sections/HeroSection.tsx`, `components/web3/BuyNxrButton.tsx` |
| Presale | `lib/web3/config.ts`, `lib/web3/hooks/usePresaleData.ts` |
| Scroll lock | `hooks/useScrollLock.ts`, `components/layout/MobileMenu.tsx`, `components/web3/ClaimNxrButton.tsx`, payment popups |
| Errors | `app/error.tsx`, `app/not-found.tsx`, `app/global-error.tsx` |
| Forms | `components/ui/Input.tsx`, `app/globals.css` |

---

## QA Checklist

| Item | Expected |
|------|----------|
| Home / About / Founder / Whitepaper | Nav hash links work |
| Market / Marketplace / Stores | Hero below navbar, background visible |
| Login / Register / Customer / Merchant register | Compact centered cards, neon background |
| `/customer/login`, `/merchant/login` | Redirect to unified login |
| `/admin/login` | Wallet admin prompt with background |
| Buy NXR | Always navigates to `/presale` |
| Presale | Shows data or error within 10s — no infinite skeleton |
| Mobile menu | Background scroll locked |
| OAuth buttons | Disabled with message when env flags false |
| Error pages | Retry / reload / home actions |

**Verdict:** All 16 sprint items addressed. Platform remains **NOT unconditional PRODUCTION READY** due to pre-existing blockers listed above.
