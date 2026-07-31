-- Nexar Network: Full database architecture extension
-- Builds on migrations 000000–000006. Does NOT recreate existing core tables.

-- ═══════════════════════════════════════════════════════════════════════════════
-- ENUMS
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE public.wallet_owner_type AS ENUM ('customer', 'merchant', 'platform', 'treasury');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.wallet_tx_type AS ENUM (
    'deposit', 'withdrawal', 'payment_in', 'payment_out',
    'fee_collection', 'refund', 'adjustment'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.wallet_tx_status AS ENUM ('pending', 'confirmed', 'failed', 'reversed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.qr_code_type AS ENUM ('marketplace', 'payment_only');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'order', 'payment', 'invoice', 'promotion', 'security', 'system'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.security_event_type AS ENUM (
    'failed_login', 'blocked_ip', 'rate_limit', 'invalid_token',
    'permission_denied', 'suspicious_activity'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.contact_message_status AS ENUM ('new', 'read', 'replied', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.currency_kind AS ENUM ('fiat', 'crypto');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extend payment session status for full lifecycle (non-breaking ADD VALUE)
ALTER TYPE public.payment_session_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.payment_session_status ADD VALUE IF NOT EXISTS 'waiting_confirmation';
ALTER TYPE public.payment_session_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE public.payment_session_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE public.payment_session_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE public.payment_session_status ADD VALUE IF NOT EXISTS 'refunded';

-- ═══════════════════════════════════════════════════════════════════════════════
-- PROFILE EXTENSIONS (customers / merchants — normalized, no profile duplication)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_currency  TEXT NOT NULL DEFAULT 'USD',
  total_orders        INTEGER NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
  total_spent_usd     NUMERIC(20,8) NOT NULL DEFAULT 0 CHECK (total_spent_usd >= 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_profile ON public.customer_profiles(profile_id);

DROP TRIGGER IF EXISTS customer_profiles_updated_at ON public.customer_profiles;
CREATE TRIGGER customer_profiles_updated_at
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS public.merchant_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id            UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name         TEXT,
  tax_id                TEXT,
  verification_status   TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  total_revenue_usd     NUMERIC(20,8) NOT NULL DEFAULT 0 CHECK (total_revenue_usd >= 0),
  total_orders          INTEGER NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_profiles_profile ON public.merchant_profiles(profile_id);

DROP TRIGGER IF EXISTS merchant_profiles_updated_at ON public.merchant_profiles;
CREATE TRIGGER merchant_profiles_updated_at
  BEFORE UPDATE ON public.merchant_profiles
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- Auto-create profile extensions on registration
CREATE OR REPLACE FUNCTION private.ensure_profile_extension()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'customer' THEN
    INSERT INTO public.customer_profiles (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  ELSIF NEW.role = 'merchant' THEN
    INSERT INTO public.merchant_profiles (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_ensure_extension ON public.profiles;
CREATE TRIGGER profiles_ensure_extension
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.ensure_profile_extension();

-- Backfill existing profiles
INSERT INTO public.customer_profiles (profile_id)
SELECT id FROM public.profiles WHERE role = 'customer'
ON CONFLICT (profile_id) DO NOTHING;

INSERT INTO public.merchant_profiles (profile_id)
SELECT id FROM public.profiles WHERE role = 'merchant'
ON CONFLICT (profile_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STORE SETTINGS (normalized from stores)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.store_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id              UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  notification_email    TEXT,
  auto_accept_orders    BOOLEAN NOT NULL DEFAULT TRUE,
  min_order_amount_usd  NUMERIC(20,8) NOT NULL DEFAULT 0 CHECK (min_order_amount_usd >= 0),
  default_currency      TEXT NOT NULL DEFAULT 'USD',
  accepts_crypto        BOOLEAN NOT NULL DEFAULT TRUE,
  accepts_card          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_settings_store ON public.store_settings(store_id);

DROP TRIGGER IF EXISTS store_settings_updated_at ON public.store_settings;
CREATE TRIGGER store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

INSERT INTO public.store_settings (store_id)
SELECT id FROM public.stores
ON CONFLICT (store_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CATALOG EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.product_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_product_categories_store ON public.product_categories(store_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_parent ON public.product_categories(parent_id);

DROP TRIGGER IF EXISTS product_categories_updated_at ON public.product_categories;
CREATE TRIGGER product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);

CREATE TABLE IF NOT EXISTS public.product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt_text    TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_one_primary
  ON public.product_images(product_id) WHERE is_primary = TRUE;

DROP TRIGGER IF EXISTS product_images_updated_at ON public.product_images;
CREATE TRIGGER product_images_updated_at
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS public.inventory (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_on_hand      INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  reserved_quantity     INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  low_stock_threshold   INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inventory_reserved_lte_on_hand CHECK (reserved_quantity <= quantity_on_hand)
);

CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory(product_id);

DROP TRIGGER IF EXISTS inventory_updated_at ON public.inventory;
CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- Sync inventory from existing products.stock
INSERT INTO public.inventory (product_id, quantity_on_hand)
SELECT id, COALESCE(stock, 0) FROM public.products
ON CONFLICT (product_id) DO NOTHING;

-- Keep products.stock in sync when inventory changes
CREATE OR REPLACE FUNCTION private.sync_product_stock_from_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock = NEW.quantity_on_hand - NEW.reserved_quantity,
      updated_at = NOW()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inventory_sync_product_stock ON public.inventory;
CREATE TRIGGER inventory_sync_product_stock
  AFTER INSERT OR UPDATE OF quantity_on_hand, reserved_quantity ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION private.sync_product_stock_from_inventory();

-- Migrate existing product image_url into product_images
INSERT INTO public.product_images (product_id, url, is_primary, sort_order)
SELECT p.id, p.image_url, TRUE, 0
FROM public.products p
WHERE p.image_url IS NOT NULL AND p.image_url != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.product_images pi WHERE pi.product_id = p.id
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUPPORTED CURRENCIES (never hardcode in application)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.supported_currencies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  symbol      TEXT NOT NULL,
  kind        public.currency_kind NOT NULL,
  decimals    SMALLINT NOT NULL DEFAULT 2 CHECK (decimals >= 0 AND decimals <= 18),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS supported_currencies_updated_at ON public.supported_currencies;
CREATE TRIGGER supported_currencies_updated_at
  BEFORE UPDATE ON public.supported_currencies
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS public.supported_fiat (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_id  UUID NOT NULL UNIQUE REFERENCES public.supported_currencies(id) ON DELETE CASCADE,
  iso_code     TEXT NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS supported_fiat_updated_at ON public.supported_fiat;
CREATE TRIGGER supported_fiat_updated_at
  BEFORE UPDATE ON public.supported_fiat
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS public.supported_crypto (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_id     UUID NOT NULL UNIQUE REFERENCES public.supported_currencies(id) ON DELETE CASCADE,
  chain_id        INTEGER NOT NULL,
  contract_address TEXT,
  is_native       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS supported_crypto_updated_at ON public.supported_crypto;
CREATE TRIGGER supported_crypto_updated_at
  BEFORE UPDATE ON public.supported_crypto
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

INSERT INTO public.supported_currencies (code, name, symbol, kind, decimals, sort_order) VALUES
  ('USD', 'US Dollar', '$', 'fiat', 2, 1),
  ('EUR', 'Euro', '€', 'fiat', 2, 2),
  ('EGP', 'Egyptian Pound', 'E£', 'fiat', 2, 3),
  ('NXR', 'Nexar Token', 'NXR', 'crypto', 18, 4),
  ('BNB', 'BNB', 'BNB', 'crypto', 18, 5),
  ('USDT', 'Tether USD', 'USDT', 'crypto', 18, 6),
  ('BTC', 'Bitcoin', 'BTC', 'crypto', 8, 7),
  ('ETH', 'Ethereum', 'ETH', 'crypto', 18, 8)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.supported_fiat (currency_id, iso_code)
SELECT id, code FROM public.supported_currencies WHERE kind = 'fiat'
ON CONFLICT DO NOTHING;

INSERT INTO public.supported_crypto (currency_id, chain_id, contract_address, is_native)
SELECT c.id,
  CASE c.code
    WHEN 'BNB' THEN 56
    WHEN 'NXR' THEN 56
    WHEN 'USDT' THEN 56
    WHEN 'ETH' THEN 1
    WHEN 'BTC' THEN 0
    ELSE 56
  END,
  CASE c.code WHEN 'USDT' THEN '0x55d398326f99059fF775485246099027B3197955' ELSE NULL END,
  c.code IN ('BNB', 'ETH', 'BTC')
FROM public.supported_currencies c
WHERE c.kind = 'crypto'
ON CONFLICT DO NOTHING;

INSERT INTO public.exchange_rates (base_currency, quote_currency, rate, source) VALUES
  ('USD', 'USD', 1.00, 'seed'),
  ('EUR', 'USD', 1.08, 'seed'),
  ('EGP', 'USD', 0.021, 'seed'),
  ('BTC', 'USD', 65000.00, 'seed'),
  ('ETH', 'USD', 3500.00, 'seed')
ON CONFLICT DO NOTHING;

ALTER TABLE public.exchange_rates
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS exchange_rates_updated_at ON public.exchange_rates;
CREATE TRIGGER exchange_rates_updated_at
  BEFORE UPDATE ON public.exchange_rates
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- PAYMENT METHODS & STATUS HISTORY
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  kind        public.currency_kind NOT NULL,
  provider    TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  config      JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

INSERT INTO public.payment_methods (code, name, kind, provider) VALUES
  ('NXR', 'Nexar Token', 'crypto', 'bsc'),
  ('BNB', 'BNB', 'crypto', 'bsc'),
  ('USDT', 'Tether USD', 'crypto', 'bsc'),
  ('BTC', 'Bitcoin', 'crypto', 'external'),
  ('ETH', 'Ethereum', 'crypto', 'external'),
  ('card', 'Credit/Debit Card', 'fiat', 'stripe')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.payment_attempts
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS payment_attempts_updated_at ON public.payment_attempts;
CREATE TRIGGER payment_attempts_updated_at
  BEFORE UPDATE ON public.payment_attempts
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS public.payment_status_history (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_session_id  UUID NOT NULL REFERENCES public.payment_sessions(id) ON DELETE CASCADE,
  from_status         public.payment_session_status,
  to_status           public.payment_session_status NOT NULL,
  reason              TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_status_history_session
  ON public.payment_status_history(payment_session_id, created_at DESC);

DROP TRIGGER IF EXISTS payment_status_history_updated_at ON public.payment_status_history;
CREATE TRIGGER payment_status_history_updated_at
  BEFORE UPDATE ON public.payment_status_history
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE OR REPLACE FUNCTION private.record_payment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.payment_status_history (payment_session_id, from_status, to_status, reason)
    VALUES (NEW.id, NULL, NEW.status, 'session_created');
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.payment_status_history (payment_session_id, from_status, to_status, reason)
    VALUES (NEW.id, OLD.status, NEW.status, 'status_changed');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payment_sessions_status_history ON public.payment_sessions;
CREATE TRIGGER payment_sessions_status_history
  AFTER INSERT OR UPDATE OF status ON public.payment_sessions
  FOR EACH ROW EXECUTE FUNCTION private.record_payment_status_change();

-- ═══════════════════════════════════════════════════════════════════════════════
-- INVOICE ITEMS (immutable snapshot at invoice time)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(20,8) NOT NULL CHECK (unit_price >= 0),
  line_total    NUMERIC(20,8) NOT NULL CHECK (line_total >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);

DROP TRIGGER IF EXISTS invoice_items_updated_at ON public.invoice_items;
CREATE TRIGGER invoice_items_updated_at
  BEFORE UPDATE ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- Populate invoice_items from order_items for existing invoices
INSERT INTO public.invoice_items (invoice_id, product_id, product_name, quantity, unit_price, line_total)
SELECT i.id, oi.product_id, oi.product_name, oi.quantity, oi.unit_price, oi.line_total
FROM public.invoices i
JOIN public.order_items oi ON oi.order_id = i.order_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.invoice_items ii WHERE ii.invoice_id = i.id
);

-- Auto-populate invoice_items on invoice creation
CREATE OR REPLACE FUNCTION private.snapshot_invoice_items()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.invoice_items (invoice_id, product_id, product_name, quantity, unit_price, line_total)
  SELECT NEW.id, oi.product_id, oi.product_name, oi.quantity, oi.unit_price, oi.line_total
  FROM public.order_items oi
  WHERE oi.order_id = NEW.order_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invoices_snapshot_items ON public.invoices;
CREATE TRIGGER invoices_snapshot_items
  AFTER INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION private.snapshot_invoice_items();

-- ═══════════════════════════════════════════════════════════════════════════════
-- WALLETS & TRANSACTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.wallets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type  public.wallet_owner_type NOT NULL,
  owner_id    UUID,
  address     TEXT,
  chain_id    INTEGER NOT NULL DEFAULT 56,
  label       TEXT,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wallets_owner_consistency CHECK (
    (owner_type IN ('platform', 'treasury') AND owner_id IS NULL)
    OR (owner_type IN ('customer', 'merchant') AND owner_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_wallets_owner ON public.wallets(owner_type, owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_one_primary_customer
  ON public.wallets(owner_id) WHERE owner_type = 'customer' AND is_primary = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_one_primary_merchant
  ON public.wallets(owner_id) WHERE owner_type = 'merchant' AND is_primary = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_one_treasury
  ON public.wallets(owner_type) WHERE owner_type = 'treasury';

DROP TRIGGER IF EXISTS wallets_updated_at ON public.wallets;
CREATE TRIGGER wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id       UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  tx_type         public.wallet_tx_type NOT NULL,
  amount          NUMERIC(30,18) NOT NULL CHECK (amount >= 0),
  currency        TEXT NOT NULL,
  balance_after   NUMERIC(30,18),
  reference_type  TEXT,
  reference_id    UUID,
  tx_hash         TEXT,
  status          public.wallet_tx_status NOT NULL DEFAULT 'pending',
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON public.wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON public.wallet_transactions(reference_type, reference_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_transactions_tx_hash
  ON public.wallet_transactions(tx_hash) WHERE tx_hash IS NOT NULL;

DROP TRIGGER IF EXISTS wallet_transactions_updated_at ON public.wallet_transactions;
CREATE TRIGGER wallet_transactions_updated_at
  BEFORE UPDATE ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- Secure treasury wallet configuration (backend-only access)
CREATE TABLE IF NOT EXISTS public.treasury_wallet (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id       UUID NOT NULL UNIQUE REFERENCES public.wallets(id) ON DELETE RESTRICT,
  encrypted_config  JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  rotated_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS treasury_wallet_updated_at ON public.treasury_wallet;
CREATE TRIGGER treasury_wallet_updated_at
  BEFORE UPDATE ON public.treasury_wallet
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- Seed treasury wallet from platform_settings (never hardcode in app)
INSERT INTO public.wallets (owner_type, label, is_primary, is_active, metadata)
SELECT 'treasury', 'Platform Treasury', TRUE, TRUE, '{"source": "migration"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.wallets WHERE owner_type = 'treasury');

INSERT INTO public.treasury_wallet (wallet_id, encrypted_config)
SELECT w.id,
  jsonb_build_object(
    'address_ref', 'platform_settings',
    'note', 'Address loaded from platform_settings.treasury_wallet_address at runtime'
  )
FROM public.wallets w
WHERE w.owner_type = 'treasury'
  AND NOT EXISTS (SELECT 1 FROM public.treasury_wallet);

-- Sync treasury address from platform_settings when available
CREATE OR REPLACE FUNCTION private.sync_treasury_address_from_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  SELECT w.id INTO v_wallet_id FROM public.wallets w WHERE w.owner_type = 'treasury' LIMIT 1;
  IF v_wallet_id IS NOT NULL AND NEW.treasury_wallet_address IS NOT NULL THEN
    UPDATE public.wallets
    SET address = NEW.treasury_wallet_address, updated_at = NOW()
    WHERE id = v_wallet_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS platform_settings_sync_treasury ON public.platform_settings;
CREATE TRIGGER platform_settings_sync_treasury
  AFTER INSERT OR UPDATE OF treasury_wallet_address ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION private.sync_treasury_address_from_settings();

-- ═══════════════════════════════════════════════════════════════════════════════
-- MERCHANT FEE PLANS (store-specific overrides; global defaults remain in fee_schedules)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.merchant_fee_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  payment_type    TEXT NOT NULL CHECK (payment_type IN ('nxr', 'crypto_other', 'card')),
  custom_rate     NUMERIC(5,4) NOT NULL CHECK (custom_rate >= 0 AND custom_rate <= 1),
  effective_from  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_fee_plans_store ON public.merchant_fee_plans(store_id, payment_type, effective_from DESC);

DROP TRIGGER IF EXISTS merchant_fee_plans_updated_at ON public.merchant_fee_plans;
CREATE TRIGGER merchant_fee_plans_updated_at
  BEFORE UPDATE ON public.merchant_fee_plans
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- Update fee calculation to check merchant_fee_plans first
CREATE OR REPLACE FUNCTION private.calculate_platform_fee(
  p_amount     NUMERIC,
  p_method     TEXT,
  p_store_id   UUID
)
RETURNS TABLE (
  platform_fee    NUMERIC,
  merchant_amount NUMERIC,
  fee_rate        NUMERIC,
  promotion_id    UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_rate     NUMERIC;
  v_discount      NUMERIC := 0;
  v_promotion_id  UUID;
  v_final_rate    NUMERIC;
  v_fee_type      TEXT;
BEGIN
  IF p_method = 'NXR' THEN
    v_fee_type := 'nxr';
  ELSIF p_method = 'card' THEN
    v_fee_type := 'card';
  ELSE
    v_fee_type := 'crypto_other';
  END IF;

  SELECT mfp.custom_rate INTO v_base_rate
  FROM public.merchant_fee_plans mfp
  WHERE mfp.store_id = p_store_id
    AND mfp.payment_type = v_fee_type
    AND mfp.is_active = TRUE
    AND mfp.effective_from <= NOW()
    AND (mfp.effective_until IS NULL OR mfp.effective_until > NOW())
  ORDER BY mfp.effective_from DESC
  LIMIT 1;

  IF v_base_rate IS NULL THEN
    SELECT fs.base_rate INTO v_base_rate
    FROM public.fee_schedules fs
    WHERE fs.payment_type = v_fee_type
    ORDER BY fs.effective_from DESC
    LIMIT 1;
  END IF;

  v_base_rate := COALESCE(v_base_rate, 0.05);

  SELECT mp.id, mp.discount_percent INTO v_promotion_id, v_discount
  FROM public.merchant_promotions mp
  WHERE mp.store_id = p_store_id
    AND mp.is_active = TRUE
    AND mp.expires_at > NOW()
  ORDER BY mp.created_at DESC
  LIMIT 1;

  IF v_discount > 0 THEN
    v_final_rate := v_base_rate * (1 - v_discount / 100);
  ELSE
    v_final_rate := v_base_rate;
  END IF;

  platform_fee := ROUND(p_amount * v_final_rate, 8);
  merchant_amount := p_amount - platform_fee;
  fee_rate := v_final_rate;
  promotion_id := v_promotion_id;
  RETURN NEXT;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- QR CODES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.qr_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  qr_type       public.qr_code_type NOT NULL DEFAULT 'marketplace',
  secret_token  TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  payload       TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_store ON public.qr_codes(store_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_codes_store_type_active
  ON public.qr_codes(store_id, qr_type) WHERE is_active = TRUE;

DROP TRIGGER IF EXISTS qr_codes_updated_at ON public.qr_codes;
CREATE TRIGGER qr_codes_updated_at
  BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- Auto-generate QR codes for existing stores
INSERT INTO public.qr_codes (store_id, qr_type, payload)
SELECT s.id, 'marketplace'::public.qr_code_type, 'nexar://store/' || s.slug || '?token=' || encode(gen_random_bytes(16), 'hex')
FROM public.stores s
WHERE s.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.qr_codes q WHERE q.store_id = s.id AND q.qr_type = 'marketplace'::public.qr_code_type
  );

INSERT INTO public.qr_codes (store_id, qr_type, payload)
SELECT s.id, 'payment_only'::public.qr_code_type, 'nexar://pay/' || s.slug || '?token=' || encode(gen_random_bytes(16), 'hex')
FROM public.stores s
WHERE s.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.qr_codes q WHERE q.store_id = s.id AND q.qr_type = 'payment_only'::public.qr_code_type
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS, SECURITY LOGS, SESSIONS, API KEYS, CONTACT
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        public.notification_type NOT NULL DEFAULT 'system',
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  read_at     TIMESTAMPTZ,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;

DROP TRIGGER IF EXISTS notifications_updated_at ON public.notifications;
CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS public.security_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  public.security_event_type NOT NULL,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_logs_event ON public.security_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON public.security_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON public.security_logs(ip_address, created_at DESC);

DROP TRIGGER IF EXISTS security_logs_updated_at ON public.security_logs;
CREATE TRIGGER security_logs_updated_at
  BEFORE UPDATE ON public.security_logs
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE OR REPLACE FUNCTION private.log_security_event(
  p_event_type  public.security_event_type,
  p_user_id     UUID DEFAULT NULL,
  p_ip_address  INET DEFAULT NULL,
  p_user_agent  TEXT DEFAULT NULL,
  p_metadata    JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.security_logs (event_type, user_id, ip_address, user_agent, metadata)
  VALUES (p_event_type, p_user_id, p_ip_address, p_user_agent, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ip_address    INET,
  user_agent    TEXT,
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(expires_at) WHERE revoked_at IS NULL;

DROP TRIGGER IF EXISTS user_sessions_updated_at ON public.user_sessions;
CREATE TRIGGER user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS public.api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  key_prefix    TEXT NOT NULL,
  key_hash      TEXT NOT NULL,
  scopes        TEXT[] NOT NULL DEFAULT '{}',
  created_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at    TIMESTAMPTZ,
  last_used_at  TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON public.api_keys(created_by);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON public.api_keys(key_prefix);

DROP TRIGGER IF EXISTS api_keys_updated_at ON public.api_keys;
CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      public.contact_message_status NOT NULL DEFAULT 'new',
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status, created_at DESC);

DROP TRIGGER IF EXISTS contact_messages_updated_at ON public.contact_messages;
CREATE TRIGGER contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.merchant_promotions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS merchant_promotions_updated_at ON public.merchant_promotions;
CREATE TRIGGER merchant_promotions_updated_at
  BEFORE UPDATE ON public.merchant_promotions
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS invoices_updated_at ON public.invoices;
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
ALTER TABLE public.settlements
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS settlements_updated_at ON public.settlements;
CREATE TRIGGER settlements_updated_at
  BEFORE UPDATE ON public.settlements
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.settlement_transfers
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS settlement_transfers_updated_at ON public.settlement_transfers;
CREATE TRIGGER settlement_transfers_updated_at
  BEFORE UPDATE ON public.settlement_transfers
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- WALLET HELPERS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION private.get_or_create_merchant_wallet(p_merchant_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  SELECT id INTO v_wallet_id
  FROM public.wallets
  WHERE owner_type = 'merchant' AND owner_id = p_merchant_id AND is_primary = TRUE
  LIMIT 1;

  IF v_wallet_id IS NULL THEN
    INSERT INTO public.wallets (owner_type, owner_id, label, is_primary)
    VALUES ('merchant', p_merchant_id, 'Primary Merchant Wallet', TRUE)
    RETURNING id INTO v_wallet_id;
  END IF;

  RETURN v_wallet_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.get_treasury_wallet_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT w.id FROM public.wallets w WHERE w.owner_type = 'treasury' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.record_wallet_transaction(
  p_wallet_id       UUID,
  p_tx_type         public.wallet_tx_type,
  p_amount          NUMERIC,
  p_currency        TEXT,
  p_reference_type  TEXT,
  p_reference_id    UUID,
  p_tx_hash         TEXT DEFAULT NULL,
  p_metadata        JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.wallet_transactions (
    wallet_id, tx_type, amount, currency, reference_type, reference_id, tx_hash, status, metadata
  ) VALUES (
    p_wallet_id, p_tx_type, p_amount, p_currency, p_reference_type, p_reference_id, p_tx_hash, 'confirmed', p_metadata
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ATOMIC PAYMENT COMPLETION (full rollback on any failure)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.complete_payment(
  p_session_id      UUID,
  p_tx_hash         TEXT,
  p_verified_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session         RECORD;
  v_order           RECORD;
  v_store           RECORD;
  v_fees            RECORD;
  v_settlement_id   UUID;
  v_treasury_id     UUID;
  v_merchant_wallet UUID;
  v_customer_wallet UUID;
BEGIN
  SELECT * INTO v_session FROM public.payment_sessions
  WHERE id = p_session_id FOR UPDATE;

  IF v_session IS NULL THEN
    RAISE EXCEPTION 'Payment session not found';
  END IF;

  IF v_session.status NOT IN ('waiting', 'waiting_confirmation', 'pending') THEN
    RAISE EXCEPTION 'Payment session not payable (status: %)', v_session.status;
  END IF;

  IF v_session.expires_at < NOW() THEN
    UPDATE public.payment_sessions SET status = 'expired', updated_at = NOW() WHERE id = p_session_id;
    RAISE EXCEPTION 'Payment session expired';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = v_session.order_id FOR UPDATE;
  SELECT * INTO v_store FROM public.stores WHERE id = v_order.store_id;

  SELECT * INTO v_fees FROM private.calculate_platform_fee(
    v_session.amount_usd, v_session.method, v_order.store_id
  );

  v_treasury_id := private.get_treasury_wallet_id();
  IF v_treasury_id IS NULL THEN
    RAISE EXCEPTION 'Treasury wallet not configured';
  END IF;

  v_merchant_wallet := private.get_or_create_merchant_wallet(v_store.owner_id);

  SELECT w.id INTO v_customer_wallet
  FROM public.wallets w
  WHERE w.owner_type = 'customer' AND w.owner_id = v_order.customer_id AND w.is_primary = TRUE
  LIMIT 1;

  IF v_customer_wallet IS NULL THEN
    INSERT INTO public.wallets (owner_type, owner_id, label, is_primary)
    VALUES ('customer', v_order.customer_id, 'Primary Customer Wallet', TRUE)
    RETURNING id INTO v_customer_wallet;
  END IF;

  INSERT INTO public.payment_attempts (
    payment_session_id, tx_hash, amount, currency, confirmations, status
  ) VALUES (
    p_session_id, p_tx_hash, p_verified_amount, v_session.currency, 12, 'confirmed'
  );

  UPDATE public.payment_sessions
  SET status = 'paid', paid_at = NOW(), updated_at = NOW()
  WHERE id = p_session_id;

  UPDATE public.invoices
  SET status = 'paid', paid_at = NOW()
  WHERE id = v_session.invoice_id;

  UPDATE public.orders
  SET
    status = 'paid',
    paid_at = NOW(),
    updated_at = NOW(),
    payment_method = CASE WHEN v_session.method = 'card' THEN 'card'::public.payment_method ELSE 'crypto'::public.payment_method END,
    platform_fee = v_fees.platform_fee,
    merchant_amount = v_fees.merchant_amount
  WHERE id = v_session.order_id;

  INSERT INTO public.settlements (
    payment_session_id, order_id, gross_amount, platform_fee, merchant_amount,
    fee_rate_applied, promotion_id, currency, status, completed_at
  ) VALUES (
    p_session_id, v_order.id, v_session.amount_usd, v_fees.platform_fee,
    v_fees.merchant_amount, v_fees.fee_rate, v_fees.promotion_id, 'USD', 'completed', NOW()
  ) RETURNING id INTO v_settlement_id;

  -- Platform fee → treasury wallet
  PERFORM private.record_wallet_transaction(
    v_treasury_id, 'fee_collection', v_fees.platform_fee, v_session.currency,
    'settlement', v_settlement_id, p_tx_hash,
    jsonb_build_object('order_id', v_order.id, 'fee_rate', v_fees.fee_rate)
  );

  -- Remaining balance → merchant wallet
  PERFORM private.record_wallet_transaction(
    v_merchant_wallet, 'payment_in', v_fees.merchant_amount, v_session.currency,
    'settlement', v_settlement_id, p_tx_hash,
    jsonb_build_object('order_id', v_order.id, 'gross', v_session.amount_usd)
  );

  -- Customer purchase record
  PERFORM private.record_wallet_transaction(
    v_customer_wallet, 'payment_out', v_session.amount_usd, 'USD',
    'order', v_order.id, p_tx_hash,
    jsonb_build_object('session_id', p_session_id)
  );

  INSERT INTO public.settlement_transfers (
    settlement_id, transfer_type, to_address, amount, currency, tx_hash, status, completed_at
  ) VALUES
    (v_settlement_id, 'platform_fee', (SELECT address FROM public.wallets WHERE id = v_treasury_id), v_fees.platform_fee, v_session.currency, p_tx_hash, 'confirmed', NOW()),
    (v_settlement_id, 'merchant_payout', (SELECT address FROM public.wallets WHERE id = v_merchant_wallet), v_fees.merchant_amount, v_session.currency, p_tx_hash, 'confirmed', NOW());

  UPDATE public.customer_profiles
  SET total_orders = total_orders + 1,
      total_spent_usd = total_spent_usd + v_session.amount_usd,
      updated_at = NOW()
  WHERE profile_id = v_order.customer_id;

  UPDATE public.merchant_profiles
  SET total_orders = total_orders + 1,
      total_revenue_usd = total_revenue_usd + v_fees.merchant_amount,
      updated_at = NOW()
  WHERE profile_id = v_store.owner_id;

  PERFORM private.write_audit_log(
    v_order.customer_id,
    (SELECT role FROM public.profiles WHERE id = v_order.customer_id),
    'payment.completed',
    'order',
    v_order.id,
    jsonb_build_object(
      'session_id', p_session_id,
      'settlement_id', v_settlement_id,
      'tx_hash', p_tx_hash,
      'platform_fee', v_fees.platform_fee,
      'merchant_amount', v_fees.merchant_amount,
      'treasury_wallet_id', v_treasury_id,
      'merchant_wallet_id', v_merchant_wallet
    )
  );

  RETURN jsonb_build_object(
    'settlement_id', v_settlement_id,
    'order_id', v_order.id,
    'platform_fee', v_fees.platform_fee,
    'merchant_amount', v_fees.merchant_amount,
    'status', 'paid'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_payment(UUID, TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_payment(UUID, TEXT, NUMERIC) TO service_role;

-- Expire merchant promotions automatically
CREATE OR REPLACE FUNCTION public.expire_merchant_promotions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.merchant_promotions
  SET is_active = FALSE, updated_at = NOW()
  WHERE is_active = TRUE AND expires_at <= NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VIEWS (aliases & reporting — no duplicated data)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.customers AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.avatar_url,
  cp.preferred_currency,
  cp.total_orders,
  cp.total_spent_usd,
  p.created_at,
  p.updated_at
FROM public.profiles p
JOIN public.customer_profiles cp ON cp.profile_id = p.id
WHERE p.role = 'customer';

CREATE OR REPLACE VIEW public.merchants AS
SELECT
  p.id,
  p.email,
  p.full_name,
  mp.business_name,
  mp.verification_status,
  mp.total_revenue_usd,
  mp.total_orders,
  p.created_at,
  p.updated_at
FROM public.profiles p
JOIN public.merchant_profiles mp ON mp.profile_id = p.id
WHERE p.role = 'merchant';

CREATE OR REPLACE VIEW public.shopping_cart AS
SELECT
  c.id,
  c.customer_id,
  c.created_at,
  c.updated_at
FROM public.carts c;

CREATE OR REPLACE VIEW public.payments AS
SELECT
  ps.id,
  ps.invoice_id,
  ps.order_id,
  CASE ps.status
    WHEN 'waiting' THEN 'waiting_confirmation'
    WHEN 'paid' THEN 'completed'
    ELSE ps.status::TEXT
  END AS status,
  ps.method,
  ps.amount,
  ps.currency,
  ps.amount_usd,
  ps.deposit_address,
  ps.qr_payload,
  ps.expires_at,
  ps.paid_at,
  ps.created_at,
  ps.updated_at
FROM public.payment_sessions ps;

CREATE OR REPLACE VIEW public.platform_fees AS
SELECT
  s.id,
  s.order_id,
  s.payment_session_id,
  s.platform_fee AS amount,
  s.fee_rate_applied AS rate,
  s.currency,
  s.promotion_id,
  s.status,
  s.created_at,
  s.updated_at
FROM public.settlements s
WHERE s.platform_fee > 0;

CREATE OR REPLACE VIEW public.v_merchant_revenue AS
SELECT
  st.owner_id AS merchant_id,
  st.id AS store_id,
  st.name AS store_name,
  COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'paid') AS order_count,
  COALESCE(SUM(o.merchant_amount) FILTER (WHERE o.status = 'paid'), 0) AS total_merchant_revenue,
  COALESCE(SUM(o.platform_fee) FILTER (WHERE o.status = 'paid'), 0) AS total_platform_fees,
  MAX(o.paid_at) FILTER (WHERE o.status = 'paid') AS last_paid_at
FROM public.stores st
LEFT JOIN public.orders o ON o.store_id = st.id
GROUP BY st.owner_id, st.id, st.name;

CREATE OR REPLACE VIEW public.v_customer_purchase_history AS
SELECT
  o.customer_id,
  o.id AS order_id,
  o.store_id,
  st.name AS store_name,
  o.subtotal AS total,
  o.status,
  o.paid_at,
  o.created_at
FROM public.orders o
JOIN public.stores st ON st.id = o.store_id
WHERE o.customer_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_fiat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_crypto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_fee_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Customer profiles
DROP POLICY IF EXISTS "Users can read own customer profile" ON public.customer_profiles;
CREATE POLICY "Users can read own customer profile"
  ON public.customer_profiles FOR SELECT USING (profile_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own customer profile" ON public.customer_profiles;
CREATE POLICY "Users can update own customer profile"
  ON public.customer_profiles FOR UPDATE USING (profile_id = auth.uid());
DROP POLICY IF EXISTS "Admins manage customer profiles" ON public.customer_profiles;
CREATE POLICY "Admins manage customer profiles"
  ON public.customer_profiles FOR ALL USING (private.current_user_role() = 'admin');

-- Merchant profiles
DROP POLICY IF EXISTS "Merchants can read own profile" ON public.merchant_profiles;
CREATE POLICY "Merchants can read own profile"
  ON public.merchant_profiles FOR SELECT USING (profile_id = auth.uid());
DROP POLICY IF EXISTS "Merchants can update own profile" ON public.merchant_profiles;
CREATE POLICY "Merchants can update own profile"
  ON public.merchant_profiles FOR UPDATE USING (profile_id = auth.uid());
DROP POLICY IF EXISTS "Admins manage merchant profiles" ON public.merchant_profiles;
CREATE POLICY "Admins manage merchant profiles"
  ON public.merchant_profiles FOR ALL USING (private.current_user_role() = 'admin');

-- Store settings
DROP POLICY IF EXISTS "Merchants manage own store settings" ON public.store_settings;
CREATE POLICY "Merchants manage own store settings"
  ON public.store_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_settings.store_id AND s.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage store settings" ON public.store_settings;
CREATE POLICY "Admins manage store settings"
  ON public.store_settings FOR ALL USING (private.current_user_role() = 'admin');
DROP POLICY IF EXISTS "Anyone can read active store settings" ON public.store_settings;
CREATE POLICY "Anyone can read active store settings"
  ON public.store_settings FOR SELECT TO authenticated USING (true);

-- Product categories & images & inventory
DROP POLICY IF EXISTS "Anyone can read active categories" ON public.product_categories;
CREATE POLICY "Anyone can read active categories"
  ON public.product_categories FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Merchants manage own categories" ON public.product_categories;
CREATE POLICY "Merchants manage own categories"
  ON public.product_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = product_categories.store_id AND s.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage categories" ON public.product_categories;
CREATE POLICY "Admins manage categories"
  ON public.product_categories FOR ALL USING (private.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Anyone can read product images" ON public.product_images;
CREATE POLICY "Anyone can read product images"
  ON public.product_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "Merchants manage own product images" ON public.product_images;
CREATE POLICY "Merchants manage own product images"
  ON public.product_images FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.stores s ON s.id = p.store_id
    WHERE p.id = product_images.product_id AND s.owner_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Admins manage product images" ON public.product_images;
CREATE POLICY "Admins manage product images"
  ON public.product_images FOR ALL USING (private.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Anyone can read inventory" ON public.inventory;
CREATE POLICY "Anyone can read inventory"
  ON public.inventory FOR SELECT USING (true);
DROP POLICY IF EXISTS "Merchants manage own inventory" ON public.inventory;
CREATE POLICY "Merchants manage own inventory"
  ON public.inventory FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.stores s ON s.id = p.store_id
    WHERE p.id = inventory.product_id AND s.owner_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Admins manage inventory" ON public.inventory;
CREATE POLICY "Admins manage inventory"
  ON public.inventory FOR ALL USING (private.current_user_role() = 'admin');

-- Currencies (read-only for users, admin write)
DROP POLICY IF EXISTS "Authenticated read currencies" ON public.supported_currencies;
CREATE POLICY "Authenticated read currencies"
  ON public.supported_currencies FOR SELECT TO authenticated USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admins manage currencies" ON public.supported_currencies;
CREATE POLICY "Admins manage currencies"
  ON public.supported_currencies FOR ALL USING (private.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Authenticated read fiat" ON public.supported_fiat;
CREATE POLICY "Authenticated read fiat"
  ON public.supported_fiat FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage fiat" ON public.supported_fiat;
CREATE POLICY "Admins manage fiat"
  ON public.supported_fiat FOR ALL USING (private.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Authenticated read crypto" ON public.supported_crypto;
CREATE POLICY "Authenticated read crypto"
  ON public.supported_crypto FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage crypto" ON public.supported_crypto;
CREATE POLICY "Admins manage crypto"
  ON public.supported_crypto FOR ALL USING (private.current_user_role() = 'admin');

-- Payment methods & status history
DROP POLICY IF EXISTS "Authenticated read payment methods" ON public.payment_methods;
CREATE POLICY "Authenticated read payment methods"
  ON public.payment_methods FOR SELECT TO authenticated USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admins manage payment methods" ON public.payment_methods;
CREATE POLICY "Admins manage payment methods"
  ON public.payment_methods FOR ALL USING (private.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Customers read own payment status history" ON public.payment_status_history;
CREATE POLICY "Customers read own payment status history"
  ON public.payment_status_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.payment_sessions ps
    JOIN public.invoices i ON i.id = ps.invoice_id
    WHERE ps.id = payment_status_history.payment_session_id AND i.customer_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Merchants read store payment status history" ON public.payment_status_history;
CREATE POLICY "Merchants read store payment status history"
  ON public.payment_status_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.payment_sessions ps
    JOIN public.orders o ON o.id = ps.order_id
    JOIN public.stores s ON s.id = o.store_id
    WHERE ps.id = payment_status_history.payment_session_id AND s.owner_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Admins manage payment status history" ON public.payment_status_history;
CREATE POLICY "Admins manage payment status history"
  ON public.payment_status_history FOR ALL USING (private.current_user_role() = 'admin');

-- Invoice items
DROP POLICY IF EXISTS "Customers read own invoice items" ON public.invoice_items;
CREATE POLICY "Customers read own invoice items"
  ON public.invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id AND i.customer_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Merchants read store invoice items" ON public.invoice_items;
CREATE POLICY "Merchants read store invoice items"
  ON public.invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    JOIN public.orders o ON o.id = i.order_id
    JOIN public.stores s ON s.id = o.store_id
    WHERE i.id = invoice_items.invoice_id AND s.owner_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Admins manage invoice items" ON public.invoice_items;
CREATE POLICY "Admins manage invoice items"
  ON public.invoice_items FOR ALL USING (private.current_user_role() = 'admin');

-- Wallets (treasury: service role only via RLS deny)
DROP POLICY IF EXISTS "Users read own wallets" ON public.wallets;
CREATE POLICY "Users read own wallets"
  ON public.wallets FOR SELECT
  USING (
    (owner_type = 'customer' AND owner_id = auth.uid())
    OR (owner_type = 'merchant' AND owner_id = auth.uid())
  );
DROP POLICY IF EXISTS "Users manage own non-treasury wallets" ON public.wallets;
CREATE POLICY "Users manage own non-treasury wallets"
  ON public.wallets FOR INSERT
  WITH CHECK (
    owner_type IN ('customer', 'merchant') AND owner_id = auth.uid()
  );
DROP POLICY IF EXISTS "Users update own wallets" ON public.wallets;
CREATE POLICY "Users update own wallets"
  ON public.wallets FOR UPDATE
  USING (
    (owner_type = 'customer' AND owner_id = auth.uid())
    OR (owner_type = 'merchant' AND owner_id = auth.uid())
  );
DROP POLICY IF EXISTS "Admins manage all wallets" ON public.wallets;
CREATE POLICY "Admins manage all wallets"
  ON public.wallets FOR ALL USING (private.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Users read own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users read own wallet transactions"
  ON public.wallet_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.wallets w
    WHERE w.id = wallet_transactions.wallet_id
      AND w.owner_type IN ('customer', 'merchant')
      AND w.owner_id = auth.uid()
  ));
DROP POLICY IF EXISTS "Admins manage wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Admins manage wallet transactions"
  ON public.wallet_transactions FOR ALL USING (private.current_user_role() = 'admin');

-- Treasury: no authenticated access (service_role bypasses RLS)
DROP POLICY IF EXISTS "Deny authenticated treasury config" ON public.treasury_wallet;
CREATE POLICY "Deny authenticated treasury config"
  ON public.treasury_wallet FOR ALL TO authenticated USING (false);

-- Merchant fee plans
DROP POLICY IF EXISTS "Merchants read own fee plans" ON public.merchant_fee_plans;
CREATE POLICY "Merchants read own fee plans"
  ON public.merchant_fee_plans FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = merchant_fee_plans.store_id AND s.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage fee plans" ON public.merchant_fee_plans;
CREATE POLICY "Admins manage fee plans"
  ON public.merchant_fee_plans FOR ALL USING (private.current_user_role() = 'admin');

-- QR codes
DROP POLICY IF EXISTS "Anyone can read active qr codes" ON public.qr_codes;
CREATE POLICY "Anyone can read active qr codes"
  ON public.qr_codes FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Merchants manage own qr codes" ON public.qr_codes;
CREATE POLICY "Merchants manage own qr codes"
  ON public.qr_codes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = qr_codes.store_id AND s.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage qr codes" ON public.qr_codes;
CREATE POLICY "Admins manage qr codes"
  ON public.qr_codes FOR ALL USING (private.current_user_role() = 'admin');

-- Notifications
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins manage notifications" ON public.notifications;
CREATE POLICY "Admins manage notifications"
  ON public.notifications FOR ALL USING (private.current_user_role() = 'admin');

-- Security logs: admin only
DROP POLICY IF EXISTS "Admins read security logs" ON public.security_logs;
CREATE POLICY "Admins read security logs"
  ON public.security_logs FOR SELECT USING (private.current_user_role() = 'admin');
DROP POLICY IF EXISTS "Admins manage security logs" ON public.security_logs;
CREATE POLICY "Admins manage security logs"
  ON public.security_logs FOR ALL USING (private.current_user_role() = 'admin');

-- User sessions
DROP POLICY IF EXISTS "Users read own sessions" ON public.user_sessions;
CREATE POLICY "Users read own sessions"
  ON public.user_sessions FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users revoke own sessions" ON public.user_sessions;
CREATE POLICY "Users revoke own sessions"
  ON public.user_sessions FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins manage sessions" ON public.user_sessions;
CREATE POLICY "Admins manage sessions"
  ON public.user_sessions FOR ALL USING (private.current_user_role() = 'admin');

-- API keys (future — admin/service only)
DROP POLICY IF EXISTS "Admins manage api keys" ON public.api_keys;
CREATE POLICY "Admins manage api keys"
  ON public.api_keys FOR ALL USING (private.current_user_role() = 'admin');

-- Contact messages
DROP POLICY IF EXISTS "Anyone can submit contact message" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact message"
  ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users read own contact messages" ON public.contact_messages;
CREATE POLICY "Users read own contact messages"
  ON public.contact_messages FOR SELECT
  USING (user_id = auth.uid() OR private.current_user_role() = 'admin');
DROP POLICY IF EXISTS "Admins manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins manage contact messages"
  ON public.contact_messages FOR ALL USING (private.current_user_role() = 'admin');

-- Grant view access
GRANT SELECT ON public.customers TO authenticated;
GRANT SELECT ON public.merchants TO authenticated;
GRANT SELECT ON public.shopping_cart TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT ON public.platform_fees TO authenticated;
GRANT SELECT ON public.v_merchant_revenue TO authenticated;
GRANT SELECT ON public.v_customer_purchase_history TO authenticated;
