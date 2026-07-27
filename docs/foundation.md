# Project Foundation

This document describes the foundation layer prepared before business logic implementation. Prompt 1 (domain modules, database, routes) is preserved; this layer adds cross-cutting infrastructure.

## Layer Model

```
┌─────────────────────────────────────────────────────────┐
│  app/          Route pages (thin — no business logic)   │
├─────────────────────────────────────────────────────────┤
│  features/     UI composition (hooks + components)      │
├─────────────────────────────────────────────────────────┤
│  components/   Reusable presentational UI               │
├─────────────────────────────────────────────────────────┤
│  services/     Workflow orchestration                   │
├─────────────────────────────────────────────────────────┤
│  modules/      Domain logic (repository + actions)      │
├─────────────────────────────────────────────────────────┤
│  lib/          Infrastructure (errors, logging, security)│
├─────────────────────────────────────────────────────────┤
│  config/       Typed configuration modules              │
└─────────────────────────────────────────────────────────┘
```

## Folder Structure

| Directory | Purpose |
|---|---|
| `app/` | Next.js App Router pages and API routes |
| `components/` | Shared UI components |
| `features/` | Feature-based UI modules (auth, cart, orders, …) |
| `hooks/` | Reusable React hooks (`useZodForm`, etc.) |
| `lib/` | Infrastructure utilities (errors, logging, security, supabase) |
| `providers/` | React context providers (Query, Web3) |
| `services/` | Service layer base class and domain services |
| `types/` | Shared TypeScript types |
| `utils/` | Pure utility functions |
| `constants/` | App constants and route definitions |
| `config/` | Typed configuration modules |
| `lib/middleware/` | Modular middleware helpers (auth, authorization, rate limiting) |
| `middleware/` | Stable re-export barrel for middleware helpers |
| `store/` | Zustand global state (UI only) |
| `styles/` | Style entry points |
| `public/` | Static assets served by Next.js |
| `assets/` | Source assets for bundler imports |
| `supabase/` | Migrations, seed, config |
| `database/` | Database client re-exports |
| `emails/` | Email template definitions |
| `schemas/` | Shared Zod schemas |
| `validators/` | Validation helpers |
| `api/` | API route handler utilities |
| `modules/` | Domain modules (from Prompt 1) |

## State Management Rules

| Concern | Tool | Location |
|---|---|---|
| Server data | TanStack Query | `providers/query-provider.tsx` |
| Global UI state | Zustand | `store/ui.store.ts` |
| Form state | React Hook Form | `hooks/useZodForm.ts` |
| Domain state | Supabase + modules | `modules/*/repository.ts` |

Never duplicate server data in Zustand. Use TanStack Query for fetching and caching.

## Forms

Every form must use React Hook Form + Zod:

```tsx
import { useZodForm } from "@/hooks/useZodForm";
import { loginSchema } from "@/schemas";

const form = useZodForm({ schema: loginSchema, defaultValues: { email: "", password: "" } });
```

## Error Handling

| Layer | Utility |
|---|---|
| API routes | `withErrorHandler()` from `@/api` |
| Server actions | `handleServerActionError()` from `@/lib/errors` |
| Validation | `validationErrorResponse()` / Zod schemas |
| Monitoring | `captureException()` from `@/lib/monitoring/sentry` |

## Security

| Control | Location |
|---|---|
| Authentication | `lib/middleware/auth.ts` |
| Authorization | `lib/middleware/authorization.ts` |
| Rate limiting | `lib/middleware/rate-limit.ts` |
| CSRF | `lib/security/csrf.ts` |
| Input sanitization | `lib/security/sanitize.ts` |
| SQL injection guard | `lib/security/sql-injection.ts` |
| Secure headers | `next.config.ts` |
| RLS | Supabase migrations |

## Logging

| Type | Module |
|---|---|
| Application | `lib/logging/logger.ts` |
| Audit | `lib/logging/audit-logger.ts` |
| Security | `lib/logging/security-logger.ts` |

## Routes

### Public
| Route | Status |
|---|---|
| `/` | Existing (marketing) |
| `/about` | Placeholder |
| `/whitepaper` | Existing |
| `/marketplace` | Redirects to `/customer/browse` |
| `/contact` | Existing |
| `/login` | Existing |
| `/signup` | Redirects to `/register` |

### Private
| Route | Status |
|---|---|
| `/dashboard` | Role-based redirect |
| `/profile` | Placeholder |
| `/wallet` | Redirects to `/customer/wallet` |
| `/orders` | Redirects to `/customer/orders` |
| `/invoices` | Redirects to `/customer/invoices` |
| `/merchant` | Existing portal |
| `/admin` | Existing portal |

## Dependencies Installed

Core packages added for foundation:

- `react-hook-form` + `@hookform/resolvers` — forms
- `zustand` — global UI state
- `qrcode.react` — payment QR codes
- `date-fns` — date formatting
- `recharts` — admin analytics charts
- `react-dropzone` — file uploads
- `@t3-oss/env-nextjs` — environment validation
- `class-variance-authority` + `@radix-ui/react-slot` — Shadcn UI base
- `tailwindcss-animate` — Shadcn animations

Already present from Prompt 1: Next.js, React, TypeScript, TailwindCSS, Supabase, Zod, TanStack Query, Framer Motion, Lucide, Sentry, Sonner (toast — used instead of react-hot-toast), PDFKit (invoice PDF generation).

## What Is NOT Implemented Yet

- Domain service workflows (scaffold classes only — extend in later phases)
- Feature-specific hooks and components (placeholder folders only)
- Email sending integration
- Business workflows in services layer

These are intentionally deferred to subsequent prompts.
