-- Production platform settings expansion + treasury seed + admin wallet challenges

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS platform_status TEXT NOT NULL DEFAULT 'operational',
  ADD COLUMN IF NOT EXISTS min_payment_usd NUMERIC(20,8) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_payment_usd NUMERIC(20,8) DEFAULT 100000,
  ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS telegram_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS merchant_promotion_discount_percent NUMERIC(5,4) DEFAULT 0.1000,
  ADD COLUMN IF NOT EXISTS merchant_promotion_duration_days INTEGER DEFAULT 90;

ALTER TABLE public.platform_settings
  DROP CONSTRAINT IF EXISTS platform_settings_platform_status_check;

ALTER TABLE public.platform_settings
  ADD CONSTRAINT platform_settings_platform_status_check
  CHECK (platform_status IN ('operational', 'degraded', 'maintenance'));

-- Seed official treasury when unset (configured via admin UI thereafter)
UPDATE public.platform_settings
SET treasury_wallet_address = '0x891f5ecf5ecaE7A71800BAd103e516e9AB65bE78'
WHERE treasury_wallet_address IS NULL;

-- Extend fee schedule payment types
ALTER TABLE public.fee_schedules
  DROP CONSTRAINT IF EXISTS fee_schedules_payment_type_check;

ALTER TABLE public.fee_schedules
  ADD CONSTRAINT fee_schedules_payment_type_check
  CHECK (payment_type IN (
    'nxr', 'crypto_other', 'card',
    'visa', 'mastercard', 'apple_pay', 'google_pay'
  ));

INSERT INTO public.fee_schedules (payment_type, base_rate)
SELECT v.payment_type, v.base_rate
FROM (VALUES
  ('visa', 0.0290::NUMERIC),
  ('mastercard', 0.0290::NUMERIC),
  ('apple_pay', 0.0290::NUMERIC),
  ('google_pay', 0.0290::NUMERIC)
) AS v(payment_type, base_rate)
WHERE NOT EXISTS (
  SELECT 1 FROM public.fee_schedules fs WHERE fs.payment_type = v.payment_type
);

-- Admin wallet signature challenges (service role only)
CREATE TABLE IF NOT EXISTS public.admin_wallet_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  nonce TEXT NOT NULL UNIQUE,
  message TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_wallet_challenges_expires
  ON public.admin_wallet_challenges(expires_at);

ALTER TABLE public.admin_wallet_challenges ENABLE ROW LEVEL SECURITY;

-- Sync treasury wallet record when platform settings treasury changes
CREATE OR REPLACE FUNCTION private.audit_treasury_wallet_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.treasury_wallet_address IS DISTINCT FROM OLD.treasury_wallet_address THEN
    PERFORM private.sync_treasury_address_from_settings();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS platform_settings_audit_treasury ON public.platform_settings;
CREATE TRIGGER platform_settings_audit_treasury
  AFTER UPDATE OF treasury_wallet_address ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION private.audit_treasury_wallet_change();
