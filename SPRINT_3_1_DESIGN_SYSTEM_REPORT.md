# Sprint 3.1 — Global Design System Report

**Objective:** Unify Nexar Network + ATLAS under one premium design language — visual refinement only; no backend, API, auth, wallet, or schema changes.

**Date:** August 7, 2026  
**Status:** Complete — `npm run typecheck` passes  
**Build:** Not run (per sprint scope)

---

## Summary

Sprint 3.1 centralized design tokens in `app/globals.css`, aligned `lib/constants/design.ts` to true black / muted gold, added a persisted Light / Dark / System theme layer, removed excessive glow effects from core components, and polished key marketing, auth, and ATLAS shell surfaces using **existing components only**.

---

## Pages Reviewed

| Area | Routes / surfaces |
|------|-------------------|
| Marketing | Home (sections), About, Founder, Whitepaper, Market, Contact (via shared layout + sections) |
| Authentication | `/login`, ATLAS Identity modal, `AuthCard` shells |
| ATLAS | Feed, Profile, Network, Messages, Notifications, Marketplace, Jobs, Events, Business |
| Dashboard | Header shell (shared tokens) |
| Global | Root layout, Navbar, GlobalBackground, Toasts |

---

## Components Reused (not rebuilt)

| Component | Change type |
|-----------|-------------|
| `components/ui/Button.tsx` | Removed gold glow shadows; muted premium variants |
| `components/ui/GlobalBackground.tsx` | True black base; removed gold radial glows |
| `components/ui/GlassCard.tsx` | Unchanged — now backed by `.nxr-card` / `.luxury-border` CSS |
| `components/ui/ThemeToggle.tsx` | **New** — theme picker UI (Light / Dark / System) |
| `components/providers/ThemeProvider.tsx` | **New** — wraps existing `AppProviders` tree |
| `components/sections/FounderSection.tsx` | Circular head-and-shoulders portrait; spacing polish |
| `components/auth/AuthCard.tsx` | Token-aligned card styling |
| `components/atlas/identity/*` | Visual consistency; glow removal |
| `components/atlas/app/AtlasAppShell.tsx` | Semantic background/border tokens |
| `components/atlas/app/AtlasAppBar.tsx` | Semantic tokens + theme toggle |
| `components/atlas/app/AtlasMobileNav.tsx` | Semantic tokens; removed avatar glow |
| `components/atlas/premium/PremiumSection.tsx` | Replaced brown-tint hex backgrounds |
| `components/layout/Navbar.tsx` | Semantic tokens + theme toggle |
| `components/dashboard/DashboardHeader.tsx` | Semantic tokens |
| `components/commerce/home/sections/CommerceCta.tsx` | Removed CTA glow shadow |

---

## Design Token Standardization

### `app/globals.css`
- **Dark (default):** `#000000` primary, `#0A0A0A` secondary, `#111111` cards, `rgba(255,255,255,0.08)` borders
- **Light:** `#FFFFFF` primary, `#F7F7F8` secondary, white cards, `rgba(0,0,0,0.08)` borders
- **Gold:** Muted premium `#C9A962` (not bright yellow)
- **Shared utilities:** `.nxr-card`, `.luxury-border`, `.section-padding`, `.font-heading`
- **Semantic Tailwind tokens:** `background`, `foreground`, `card`, `surface`, `border`, `muted`, `gold`

### `lib/constants/design.ts`
- Updated to match CSS tokens (removed brown-tint `#141414` / bright `#D4AF37` accent)
- Added `RADIUS` and `SPACING` exports for documentation parity

---

## Theme Improvements

| Feature | Implementation |
|---------|----------------|
| Light / Dark / System | `components/providers/ThemeProvider.tsx` |
| Persistence | `localStorage` key `nxr-theme` — never reset on navigation |
| FOUC prevention | Inline init script in `app/layout.tsx` |
| User control | `ThemeToggle` in Navbar (sm+) and Atlas App Bar (lg+) |
| Viewport | `colorScheme: light dark` + adaptive `themeColor` |

---

## UI Improvements

### Colors
- Replaced `#050505`, `#070708`, `#0a0e1a` hardcoded shells with semantic `bg-background`
- Removed brown-tint section backgrounds in `PremiumSection`
- Muted gold palette applied consistently

### Glow removal
- `Button` primary variant — no gold box-shadow
- `AtlasIdentityCard`, `AuthCard`, `AtlasSignInForm` — no outer gold glow
- `FounderSection` — removed blur glow rings and background gold wash
- `GlobalBackground` — removed gold radial key lights
- `AtlasMobileNav` profile ring — removed `shadow-gold/20`
- `CommerceCta` — removed gold CTA glow

### Founder page
- **Before:** Oversized vertical card with full-body crop
- **After:** Circular portrait (head & shoulders via `object-[center_18%]`), name/role below, refined spacing

### Authentication
- ATLAS Identity card, fields, tabs aligned to design tokens
- Inputs use `bg-background/60`, `border-border`, `text-foreground`
- No auth logic touched

### Cards & buttons
- `.nxr-card` — consistent radius (`0.75rem`), subtle shadow, border
- `.luxury-border` — single border token
- Button heights/radii unchanged (existing `Button` sizes preserved)

---

## Responsive Improvements

- Founder portrait max-width tuned (`280px` / `320px`) for mobile/tablet
- Theme toggle hidden on smallest Navbar row (`sm+`) to preserve wallet + menu space
- Atlas mobile nav uses `bg-background/98` with safe-area padding (unchanged layout)

---

## Accessibility Improvements

- Theme toggle: `role="group"`, `aria-label`, `aria-pressed` per option
- Existing focus rings preserved on `Button` and Navbar controls
- Improved light-mode contrast via semantic text tokens
- Founder social link retains descriptive `aria-label`

---

## Performance

- No new heavy animation libraries
- ThemeProvider uses minimal effects + `matchMedia` listener for system mode only
- Reused all existing components — no duplicate UI trees

---

## Typecheck

```bash
npm run typecheck  # ✅ exit 0
```

---

## Remaining Visual Improvements

| Priority | Item |
|----------|------|
| Medium | ~40 files still use hardcoded `#050505` / `text-white` — migrate incrementally to semantic tokens |
| Medium | `HeroSection`, `PresalePanel`, `WalletMenu` still reference glow props / gold shadows |
| Medium | Light mode on deeply nested ATLAS feed cards (`FeedPostCard`, etc.) — partial token coverage |
| Low | `MouseGlowLayer` still active on marketing pages — consider disabling in light mode |
| Low | `PremiumNavigation.tsx` legacy shell still uses `#050505` hex |
| Low | Theme toggle not yet in mobile menu drawer |
| Low | Dashboard sidebar tiles — audit for light-mode border contrast |

---

## Files Modified

| File | Change |
|------|--------|
| `app/globals.css` | Full design token system + light/dark + card utilities |
| `app/layout.tsx` | Theme init script, semantic body/main classes |
| `lib/constants/design.ts` | Aligned color constants |
| `lib/theme/constants.ts` | **New** — theme preference types + helpers |
| `components/providers/ThemeProvider.tsx` | **New** |
| `components/providers/AppProviders.tsx` | Wire ThemeProvider |
| `components/ui/ThemeToggle.tsx` | **New** |
| `components/ui/Button.tsx` | Muted styling, glow removal |
| `components/ui/GlobalBackground.tsx` | True black, no gold glow |
| `components/layout/Navbar.tsx` | Tokens + theme toggle |
| `components/sections/FounderSection.tsx` | Circular portrait |
| `components/auth/AuthCard.tsx` | Token styling |
| `components/atlas/identity/*` | Token + glow polish |
| `components/atlas/app/AtlasAppShell.tsx` | Semantic shells |
| `components/atlas/app/AtlasAppBar.tsx` | Semantic shells + theme toggle |
| `components/atlas/app/AtlasMobileNav.tsx` | Semantic tokens |
| `components/atlas/premium/PremiumSection.tsx` | Remove brown hex |
| `components/dashboard/DashboardHeader.tsx` | Semantic header |
| `components/commerce/home/sections/CommerceCta.tsx` | Glow removal |

---

## Conclusion

Sprint 3.1 establishes a **single source of truth** for colors, spacing, cards, and themes while reusing every existing page and component. Dark mode is true black with muted gold; light mode is fully wired at the token layer. Incremental migration of remaining hardcoded hex values and glow utilities in secondary surfaces is recommended for Sprint 3.2.
