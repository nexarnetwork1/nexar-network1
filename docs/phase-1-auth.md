# Phase 1 — Auth & Users Setup

## Supabase Dashboard

1. Enable auth providers under **Authentication → Providers**:
   - Email (enabled by default)
   - Google OAuth
   - Apple Sign In

2. Set redirect URLs under **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (dev) / production URL
   - Redirect URLs: `http://localhost:3000/auth/callback`

3. Apply migrations:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

4. Set environment variables (copy from `.env.example`):
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only — syncs app_metadata roles)

## Routes

| Route | Purpose |
|---|---|
| `/login` | Unified sign-in (email + Google + Apple) |
| `/register` | Choose customer or merchant |
| `/register/customer` | Customer registration |
| `/register/merchant` | Merchant registration + store creation |
| `/auth/callback` | OAuth callback handler |
| `/auth/complete-profile` | One-time OAuth profile completion |
| `/customer` | Customer dashboard |
| `/merchant` | Merchant dashboard |

## Admin Users

Promote a user to admin via SQL (after they register):

```sql
UPDATE public.profiles
SET role = 'admin', profile_completed = true
WHERE email = 'admin@nexarnetwork.org';
```

Then sync app_metadata (requires service role or Supabase dashboard).

## Merchant Store Activation

New merchant stores start with `status = 'pending'`. Admin activates:

```sql
UPDATE public.stores SET status = 'active' WHERE id = 'STORE_UUID';
```

Activating a store auto-creates a 3-month 50% platform fee promotion.
