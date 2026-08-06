# NEXAR HQ — Platform Core Administration

**Sole internal administration capability of ATLAS by NEXAR NETWORK**

> ATLAS is the Operating System.  
> NEXAR HQ is an **internal ATLAS module** — not a separate Admin Panel product.  
> Customers must never know NEXAR HQ exists.

---

## Mission

Evolve the legacy Admin Dashboard into **NEXAR HQ**:

- One administration system
- Reuse `modules/platform`, `lib/admin`, `app/admin` APIs & logic
- Platform Owner bootstrap
- Website CMS contracts + Announcement Center
- Team management (Platform Owner excluded / permanent)

**No final HQ UI in this phase** — architecture, permissions, bootstrap, services, events, tests.

---

## Architecture

| Layer | Location |
|-------|----------|
| Context | `atlasHq` (legacy alias: `administration`) |
| Module | `modules/atlas-hq/` |
| Database | `atlas_hq_*` |
| Port | `AtlasHqPort` |
| Authz | `lib/hq/authorization.ts` + legacy `lib/admin/*` (treasury wallet) |
| Nav IA | `config/nexar-hq-nav.ts` · ATLAS entry `nexar-hq` in `config/atlas-nav.ts` |

```
ATLAS login (Auth.js)
  → Platform Owner?
       yes → ATLAS dashboard + NEXAR NETWORK workspace + HQ sidebar icon
       no  → normal workspace only (HQ invisible)
```

Legacy `/admin/*` routes remain as **compatibility surfaces** mapped into HQ sections via `LEGACY_ADMIN_TO_HQ`. They are not a second product.

---

## Platform Owner

| Field | Value |
|-------|--------|
| Email | Chosen in Platform Owner Wizard (default prefills `admin@nexarnetwork.org`) |
| Password | Supplied at install — **bcrypt hashed**; never hardcoded in source |
| Role | `platform_owner` (permanent) |
| After first login | Must change password · Must enable 2FA |

**Permanent protections:** cannot be deleted, disabled, suspended, or demoted. Never listed in Team Management.

First install: `/admin/setup` → Wizard → then `/admin/login` via ATLAS Auth.js.

---

## Bootstrap (once)

`runPlatformOwnerWizard({ email, password })` via `/api/hq/bootstrap`:

1. Create Platform Owner (hashed password)
2. Create **NEXAR NETWORK** business
3. Create Connect workspace
4. Assign Business Owner + Platform Owner
5. Seed website page contracts
6. Mark `atlas_hq_bootstrap.completed_at`

Idempotent — locked by singleton row `atlas_hq_bootstrap.id = 1`. Auto-bootstrap on server start is **disabled**.

Wallet Super Admin authentication was **removed** in Phase 12.

---

## Modules (IA)

Dashboard · Platform · Website · Company · Team · Analytics · Finance · Marketplace · Support · Verification · AI · Apps · Developers · Infrastructure · Security · Settings

Staff roles (`HQ_STAFF_ROLES`) each receive a subset via `HQ_ROLE_DASHBOARDS`.

---

## Website & Announcements

- `atlas_hq_website_pages` / sections / globals — CMS contracts for www.nexarnetwork.org
- `atlas_hq_announcements` — Announcement Center (title, message, CTA, colors, schedule, preview)
- Legacy `ticker_announcements` remains; HQ Announcement Center is the SoT going forward

---

## Permissions

`hq:*` keys in `domains/permissions/matrix.ts`.  
`platform_owner` holds full HQ + legacy admin/treasury.  
Customers receive **zero** `hq:*` permissions.

---

## Related

- Migration: `supabase/migrations/20260805000000_atlas_hq_foundation.sql`
- Report: [NEXAR-HQ-MIGRATION-REPORT.md](./NEXAR-HQ-MIGRATION-REPORT.md)
