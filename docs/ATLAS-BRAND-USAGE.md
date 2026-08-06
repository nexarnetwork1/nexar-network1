# ATLAS Brand Usage Report

**Official lockup (sole product mark):** `/public/brand/atlas/atlas-logo-primary.png`  
**Canonical path:** `ATLAS_ASSETS.logoPrimary` → `/brand/atlas/atlas-logo-primary.png`  
**Components:** `AtlasLogo` (primary) · `Logo` (thin wrapper → `AtlasLogo`)

---

## Where the official ATLAS logo is used

| Surface | File(s) | Mechanism |
|---------|---------|-----------|
| Navbar | `components/layout/Navbar.tsx` | `<Logo />` |
| Mobile menu | `components/layout/MobileMenu.tsx` | `<Logo />` |
| Marketing footer | `components/layout/Footer.tsx` | `<Logo />` |
| Commerce footer | `components/commerce/home/sections/CommerceFooter.tsx` | `<Logo />` |
| Auth cards (login/register/forgot/reset/verify/profile) | `components/auth/AuthCard.tsx` | `<AtlasLogo />` |
| Change password | `app/auth/change-password/page.tsx` | `<AtlasLogo />` |
| Enable 2FA | `app/auth/enable-2fa/page.tsx` | `<AtlasLogo />` |
| NEXAR HQ login | `app/admin/(auth)/login/page.tsx` | `<Logo />` |
| Platform Owner setup | `app/admin/setup/page.tsx` | `<Logo />` |
| Workspace sidebar | `components/dashboard/DashboardSidebar.tsx` | `<AtlasLogo />` + portal subtitle only |
| Workspace mobile drawer | `components/dashboard/DashboardMobileDrawer.tsx` | `<AtlasLogo />` |
| Workspace header (tablet) | `components/dashboard/DashboardHeader.tsx` | `<AtlasLogo />` |
| Branded loaders / splash | `components/ui/AtlasLoader.tsx` → portal `loading.tsx` | `<AtlasLogo />` |
| System status (404/401/403/…) | `components/system/SystemStatusPage.tsx` | `<AtlasLogo />` |
| Global error boundary | `app/global-error.tsx` | `ATLAS_ASSETS.logoPrimary` (inline `<img>`) |
| Pricing / Blog / Developers / Docs | `app/{pricing,blog,developers,documentation}/page.tsx` | `<AtlasLogo />` |
| Open Graph image | `app/opengraph-image.tsx` | local primary PNG (base64) |
| Favicon / app icon | `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico` | square canvas from lockup |
| PWA icon | `public/brand/atlas/atlas-icon-512.png`, `public/manifest.json` | `ATLAS_ASSETS.icon512` |
| Icon route | `app/icon-512/route.tsx` | serves `atlas-icon-512.png` |
| Metadata icons | `lib/constants/seo.ts` | icon512 + `/icon` |

**Source of truth:** `config/atlas-branding.ts` (`ATLAS_ASSETS`, `ATLAS_BRAND`).

---

## Intentionally not ATLAS product branding

These are **not** temporary ATLAS logos — leave as-is:

| Asset / component | Role |
|-------------------|------|
| `CurrencyLogo` / `PaymentMethodLogo` | Payment rails (USDT, BTC, card, …) |
| `CURRENCY_ASSETS.NXR` → `/logo.png` | **NXR token** mark for wallets/checkout |
| `lib/web3/add-nxr-token.ts` remote `logo.png` | Wallet “add token” metadata for NXR |
| Lucide `Globe` / `Globe2` / `NexarGlobe` | Decorative UI / 3D commerce globe — not a brand mark |
| `HeroWalletLogos` | Third-party wallet icons |
| Merchant store `logo` / `faviconUrl` | Per-business storefront assets |

---

## Temporary / legacy assets still on disk (not wired as ATLAS mark)

| Path | Status |
|------|--------|
| `public/images/logo.png` | Legacy NEXAR wordmark — **no longer referenced** by `Logo` / branding config |
| `public/logo.png` | Used only as **NXR currency** asset via payment branding |

Safe to keep for NXR; do not use either as the ATLAS product logo.

---

## Rules enforced

1. One official ATLAS lockup — `atlas-logo-primary.png`
2. No duplicate wordmark text beside the lockup (sidebar shows portal subtitle only)
3. `Logo` always renders `AtlasLogo` — `brand="nexar"` removed from the live path
4. Icons use the square ATLAS canvas (`atlas-icon-512` / generated app icons)

---

*Generated as part of the final ATLAS branding pass.*
