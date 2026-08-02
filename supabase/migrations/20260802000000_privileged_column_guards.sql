-- Phase 0 security hardening — privileged column guards.
--
-- Problem: "Users can update own profile" allows any column on the caller's own
-- row, so an authenticated client could set profiles.role = 'admin'. Because
-- private.current_user_role() reads that same column, every "Admins can ..."
-- policy in the schema would then activate for that user.
--
-- Fix: BEFORE UPDATE triggers that reject privileged column writes unless the
-- connection runs as service_role (the server-side admin client) or a migration
-- superuser. Nothing is dropped, no column is added and no permission is
-- widened, so this migration is additive.
--
-- Implementation note: the role test is inlined in each trigger function rather
-- than shared through a helper. Trigger functions do not require the invoking
-- role to hold EXECUTE on themselves, but a nested call into the locked-down
-- `private` schema would be permission-checked against `authenticated`.

-- ---------------------------------------------------------------------------
-- profiles.role
-- ---------------------------------------------------------------------------
-- Only escalation to 'admin' is blocked. Self-service onboarding
-- (completeProfileAction) moves users between 'customer' and 'merchant' with
-- the authenticated client and keeps working unchanged.
CREATE OR REPLACE FUNCTION private.guard_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_role TEXT;
  privileged BOOLEAN;
BEGIN
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  IF NEW.role <> 'admin'::public.user_role THEN
    RETURN NEW;
  END IF;

  privileged := current_user IN (
    'service_role',
    'postgres',
    'supabase_admin',
    'supabase_auth_admin'
  );

  IF NOT privileged THEN
    BEGIN
      jwt_role := current_setting('request.jwt.claims', TRUE)::JSONB ->> 'role';
    EXCEPTION
      WHEN OTHERS THEN
        jwt_role := NULL;
    END;
    privileged := jwt_role = 'service_role';
  END IF;

  IF NOT privileged THEN
    RAISE EXCEPTION
      'Assigning the admin role requires service-role access'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_role_escalation ON public.profiles;
CREATE TRIGGER profiles_guard_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_profile_role_escalation();

-- ---------------------------------------------------------------------------
-- merchant_profiles verification columns
-- ---------------------------------------------------------------------------
-- "Merchants can update own profile" has no WITH CHECK and no column list, so a
-- merchant could self-approve KYC. These columns are owned by
-- modules/verification/repository.ts, which always uses the service-role client.
-- Client writes silently keep the previous values instead of raising, so
-- legitimate business-detail edits are unaffected.
CREATE OR REPLACE FUNCTION private.guard_merchant_verification_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_role TEXT;
  privileged BOOLEAN;
BEGIN
  privileged := current_user IN (
    'service_role',
    'postgres',
    'supabase_admin',
    'supabase_auth_admin'
  );

  IF NOT privileged THEN
    BEGIN
      jwt_role := current_setting('request.jwt.claims', TRUE)::JSONB ->> 'role';
    EXCEPTION
      WHEN OTHERS THEN
        jwt_role := NULL;
    END;
    privileged := jwt_role = 'service_role';
  END IF;

  IF privileged THEN
    RETURN NEW;
  END IF;

  NEW.verification_status := OLD.verification_status;
  NEW.verification_level := OLD.verification_level;
  NEW.kyc_provider := OLD.kyc_provider;
  NEW.kyc_reference := OLD.kyc_reference;
  NEW.verified_at := OLD.verified_at;
  NEW.blacklisted_at := OLD.blacklisted_at;
  NEW.blacklist_reason := OLD.blacklist_reason;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS merchant_profiles_guard_verification ON public.merchant_profiles;
CREATE TRIGGER merchant_profiles_guard_verification
  BEFORE UPDATE ON public.merchant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_merchant_verification_columns();

-- ---------------------------------------------------------------------------
-- Admin update policy gains WITH CHECK
-- ---------------------------------------------------------------------------
-- USING alone leaves the post-update row unchecked. Adding WITH CHECK keeps the
-- same permission set while ensuring the resulting row still satisfies the
-- policy. Role changes remain governed by the trigger above.
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (private.current_user_role() = 'admin')
  WITH CHECK (private.current_user_role() = 'admin');

COMMENT ON FUNCTION private.guard_profile_role_escalation() IS
  'Blocks client-side privilege escalation to profiles.role = admin.';
COMMENT ON FUNCTION private.guard_merchant_verification_columns() IS
  'Keeps merchant KYC/verification columns writable only by the service-role client.';
