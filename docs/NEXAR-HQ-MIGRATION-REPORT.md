# NEXAR HQ — Migration Report

**ATLAS Platform Core Integration · Administration Evolution**  
**Date:** 2026-08-04 · **UI:** deferred (foundation only)

---

## 1. Summary

The legacy Admin product is **not** replaced with a second panel. It is evolved into **NEXAR HQ**, an internal ATLAS capability (`atlasHq` / `modules/atlas-hq`). Existing `app/admin`, `modules/platform`, and `lib/admin` continue to serve operations under HQ IA and permissions.

**Readiness (foundation):** **8.0 / 10** — architecture, bootstrap, permissions, contracts, and tests are in place; HQ UI and TOTP enrollment UX remain for a later phase.

---

## 2. What changed

| Area | Change |
|------|--------|
| Domain | New context `atlasHq`; `administration` marked legacy alias |
| Role | `platform_owner` added to `NbosRole` / `UserRole` / Postgres enum |
| Module | `modules/atlas-hq/` — bootstrap, founder, team, website, announcements, port |
| Auth | Login emits `user.logged_in`; Platform Owner post-login path + password/2FA gates |
| Redirect | `admin` / `super_admin` / `platform_owner` → ATLAS `/dashboard?hq=1` |
| Nav | `config/nexar-hq-nav.ts` + `nexar-hq` in `atlas-nav.ts` |
| Authz | `lib/hq/authorization.ts` (Auth.js HQ) alongside treasury wallet Super Admin |
| Security routes | `platform_owner` prefixes include `/dashboard` and `/admin` |
| Events | `hq.bootstrapped`, `hq.owner_login`, team/CMS events |
| Permissions | Full `hq:*` matrix; customers have none |
| Bootstrap | Idempotent on instrumentation (Node runtime) |
| DB | `20260805000000_atlas_hq_foundation.sql` |

---

## 3. Legacy Admin → NEXAR HQ

| Legacy | HQ treatment |
|--------|----------------|
| `app/admin/**` | Compatibility routes; mapped via `LEGACY_ADMIN_TO_HQ` |
| `ADMIN_NAV` | Remains operational until HQ shell UI; IA defined in `NEXAR_HQ_NAV` |
| `requireSuperAdmin()` / wallet cookie | Kept for treasury; `hasAnyAdminAuthority()` unions HQ + wallet |
| `modules/platform` | Reused — platform mutations stay here |
| `modules/ticker` | Superseded as SoT by `atlas_hq_announcements`; ticker kept for back-compat reads |
| Metadata “Nexar CMS” | Becomes Website capability inside HQ |

**There is one administration system:** NEXAR HQ. Legacy paths are entry points into it, not a parallel product.

---

## 4. Bootstrap & credentials

- Email: `admin@nexarnetwork.org`
- Password: hashed with **bcrypt (12 rounds)** at bootstrap; **never** written plaintext to DB
- Override: `NEXAR_PLATFORM_OWNER_BOOTSTRAP_PASSWORD` / `NEXAR_PLATFORM_OWNER_EMAIL`
- Flags: `must_change_password`, `must_enable_2fa` until completed
- Creates: Platform Owner · NEXAR NETWORK business · Connect workspace · website page seeds

---

## 5. Login / sidebar contract

| Actor | Experience |
|-------|------------|
| Customer / Merchant | Normal ATLAS workspace — **no HQ icon** |
| HQ staff | ATLAS + HQ sections allowed by role |
| Platform Owner | ATLAS + NEXAR NETWORK workspace + **NEXAR HQ** sidebar entry |

Sidebar module list: `atlasSidebarModules({ showNexarHq })` in `modules/atlas-hq/founder.ts`.

---

## 6. Website & Announcement contracts

Implemented as data + services (no final CMS UI):

- Pages / sections / globals / media / email templates tables
- Announcement Center fields: enable, title, message, button, priority, colors, icon, schedule, preview
- Seeded page keys covering Home → Menus (see `HQ_WEBSITE_PAGE_KEYS`)

---

## 7. Team management

- Platform Owner **never** listed
- Mutations that delete/disable/suspend/demote Platform Owner **throw**
- Staff roles: support, finance, developer, devops, marketing, content, verification, moderator, security, analytics, apps, custom
- Activity log JSON on members; last login column reserved

---

## 8. Tests

- `tests/unit/atlas-hq/foundation.test.ts`
- `tests/integration/atlas-hq/foundation.test.ts`

Coverage: ownership, founder detection, sidebar visibility, permissions, bcrypt hashing, post-login gates, port shape.

---

## 9. Remaining work (not in this phase)

1. HQ shell UI (reuse `DashboardShell` + `NEXAR_HQ_NAV`)
2. TOTP enrollment page (`/auth/enable-2fa`) wired to `markOwner2faEnabled`
3. Migrate ticker admin UI → Announcement Center actions
4. Gradually gate `requireSuperAdmin` pages with `requireHqAccess` / `hasAnyAdminAuthority`
5. Soft-decommission wallet-only Super Admin as primary path (keep as break-glass)
6. Public site loaders reading `atlas_hq_website_pages` / announcements

---

## 10. Technical debt

| Item | Notes |
|------|-------|
| Dual authz (wallet + HQ) | Intentional during migration |
| Bootstrap on every cold start | Idempotent; consider explicit CLI for prod |
| `platform_owner` RLS | Enum added; RLS policies still check `admin` — extend later |
| Password in env fallback | Documented; force env in production installs |

---

## 11. Files to know

```
modules/atlas-hq/
config/nexar-hq-nav.ts
lib/hq/authorization.ts
supabase/migrations/20260805000000_atlas_hq_foundation.sql
docs/ATLAS-HQ.md
docs/NEXAR-HQ-MIGRATION-REPORT.md
```

---

**Verdict:** Admin is no longer a separate product identity. **NEXAR HQ** is the sole ATLAS internal administration spine, with Platform Owner bootstrap, website/announcement contracts, and team architecture ready for UI.
