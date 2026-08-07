# Middleware

Next.js edge proxy entry point lives at the project root: `proxy.ts`.

Modular helpers are organized in `lib/middleware/`:

| Module | Purpose |
|---|---|
| `auth.ts` | Session routing, email verification, profile completion |
| `authorization.ts` | Role-based route access checks |
| `rate-limit.ts` | Per-route rate limiting |

Import from the barrel:

```ts
import { applyRateLimit, handleAuthRouting, hasRoleAccess } from "@/middleware";
```
