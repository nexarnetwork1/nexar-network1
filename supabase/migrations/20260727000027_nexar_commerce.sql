-- Nexar Commerce: enterprise commerce schema (additive, idempotent)

-- ─── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.brand_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.store_verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.commerce_activity_type AS ENUM (
    'store_created', 'product_created', 'order_placed', 'order_paid',
    'review_posted', 'brand_submitted', 'brand_approved', 'store_verified', 'follow'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.analytics_event_type AS ENUM (
    'page_view', 'product_view', 'add_to_cart', 'checkout_start', 'purchase', 'search'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Countries (reference) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.countries (
  code         CHAR(2) PRIMARY KEY,
  name         TEXT NOT NULL,
  region       TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_countries_active ON public.countries(is_active) WHERE is_active = TRUE;

INSERT INTO public.countries (code, name, region) VALUES
  ('US', 'United States', 'Americas'),
  ('GB', 'United Kingdom', 'Europe'),
  ('DE', 'Germany', 'Europe'),
  ('FR', 'France', 'Europe'),
  ('AE', 'United Arab Emirates', 'Middle East'),
  ('SA', 'Saudi Arabia', 'Middle East'),
  ('EG', 'Egypt', 'Africa'),
  ('NG', 'Nigeria', 'Africa'),
  ('IN', 'India', 'Asia'),
  ('SG', 'Singapore', 'Asia'),
  ('JP', 'Japan', 'Asia'),
  ('AU', 'Australia', 'Oceania'),
  ('CA', 'Canada', 'Americas'),
  ('BR', 'Brazil', 'Americas')
ON CONFLICT (code) DO NOTHING;

-- ─── Brands (admin-approved, auto-surface when approved) ─────────────────────
CREATE TABLE IF NOT EXISTS public.brands (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id     UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL,
  logo_url     TEXT,
  description  TEXT,
  status       public.brand_status NOT NULL DEFAULT 'pending',
  approved_at  TIMESTAMPTZ,
  approved_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejected_at  TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_brands_store ON public.brands(store_id);
CREATE INDEX IF NOT EXISTS idx_brands_status ON public.brands(status);
CREATE INDEX IF NOT EXISTS idx_brands_approved ON public.brands(status, approved_at DESC)
  WHERE status = 'approved';

DROP TRIGGER IF EXISTS brands_updated_at ON public.brands;
CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ─── Product extensions ──────────────────────────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_store_slug
  ON public.products(store_id, slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id) WHERE brand_id IS NOT NULL;

-- ─── Product variants ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku             TEXT NOT NULL,
  title           TEXT NOT NULL,
  option_values   JSONB NOT NULL DEFAULT '{}'::JSONB,
  price           NUMERIC(20,8) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(20,8) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  currency        TEXT NOT NULL DEFAULT 'USD',
  stock           INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  image_url       TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON public.product_variants(product_id, is_active)
  WHERE is_active = TRUE;

-- Backfill one default variant per existing product
INSERT INTO public.product_variants (product_id, sku, title, price, currency, stock, is_active)
SELECT
  p.id,
  'SKU-' || REPLACE(p.id::TEXT, '-', ''),
  p.name,
  p.price,
  p.currency,
  p.stock,
  p.is_active
FROM public.products p
WHERE NOT EXISTS (SELECT 1 FROM public.product_variants pv WHERE pv.product_id = p.id)
ON CONFLICT (product_id, sku) DO NOTHING;

DROP TRIGGER IF EXISTS product_variants_updated_at ON public.product_variants;
CREATE TRIGGER product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- ─── Platform sub-categories ───────────────────────────────────────────────────
ALTER TABLE public.marketplace_categories
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_marketplace_categories_parent
  ON public.marketplace_categories(parent_id) WHERE parent_id IS NOT NULL;

-- ─── Store branding (typed, replaces JSONB-only for commerce UI) ─────────────
CREATE TABLE IF NOT EXISTS public.store_branding (
  store_id         UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  banner_url       TEXT,
  primary_color    TEXT,
  secondary_color  TEXT,
  accent_color     TEXT,
  tagline          TEXT,
  social_links     JSONB NOT NULL DEFAULT '{}'::JSONB,
  policies         TEXT,
  featured         BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_branding_featured
  ON public.store_branding(featured) WHERE featured = TRUE;

-- ─── Store verification (store-level) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.store_verifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status          public.store_verification_status NOT NULL DEFAULT 'unverified',
  document_urls   JSONB NOT NULL DEFAULT '[]'::JSONB,
  notes           TEXT,
  verified_at     TIMESTAMPTZ,
  verified_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_store_verifications_store_active
  ON public.store_verifications(store_id)
  WHERE status IN ('pending', 'verified');

CREATE INDEX IF NOT EXISTS idx_store_verifications_status ON public.store_verifications(status);

DROP TRIGGER IF EXISTS store_verifications_updated_at ON public.store_verifications;
CREATE TRIGGER store_verifications_updated_at
  BEFORE UPDATE ON public.store_verifications
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ─── Followers & favorites ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.store_followers (
  store_id      UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (store_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_store_followers_customer ON public.store_followers(customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.store_favorites (
  store_id      UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (store_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_store_favorites_customer ON public.store_favorites(customer_id, created_at DESC);

-- wishlist_items already covers product favorites

-- ─── Subscriptions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(20,8) NOT NULL CHECK (price >= 0),
  currency      TEXT NOT NULL DEFAULT 'USD',
  interval_days INTEGER NOT NULL CHECK (interval_days > 0),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_store ON public.subscription_plans(store_id, is_active);

DROP TRIGGER IF EXISTS subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS public.customer_subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id       UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  store_id      UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status        public.subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end   TIMESTAMPTZ NOT NULL,
  cancelled_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_customer
  ON public.customer_subscriptions(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_store
  ON public.customer_subscriptions(store_id, status);

DROP TRIGGER IF EXISTS customer_subscriptions_updated_at ON public.customer_subscriptions;
CREATE TRIGGER customer_subscriptions_updated_at
  BEFORE UPDATE ON public.customer_subscriptions
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ─── Analytics events (append-only, partitioned-ready) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.commerce_analytics_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  customer_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  product_id    UUID REFERENCES public.products(id) ON DELETE SET NULL,
  event_type    public.analytics_event_type NOT NULL,
  session_id    TEXT,
  country_code  CHAR(2) REFERENCES public.countries(code) ON DELETE SET NULL,
  metadata      JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commerce_analytics_store_time
  ON public.commerce_analytics_events(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_analytics_type_time
  ON public.commerce_analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_analytics_product
  ON public.commerce_analytics_events(product_id, created_at DESC)
  WHERE product_id IS NOT NULL;

-- ─── Activity feed ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.commerce_activity_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type public.commerce_activity_type NOT NULL,
  actor_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  store_id      UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  product_id    UUID REFERENCES public.products(id) ON DELETE SET NULL,
  order_id      UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  brand_id      UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  payload       JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_public     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commerce_activity_public_time
  ON public.commerce_activity_events(is_public, created_at DESC)
  WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_commerce_activity_store_time
  ON public.commerce_activity_events(store_id, created_at DESC)
  WHERE store_id IS NOT NULL;

-- ─── Merchant daily rollups (computed from orders, not hardcoded) ──────────────
CREATE TABLE IF NOT EXISTS public.merchant_daily_analytics (
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  revenue         NUMERIC(20,8) NOT NULL DEFAULT 0,
  orders_count    INTEGER NOT NULL DEFAULT 0,
  customers_count INTEGER NOT NULL DEFAULT 0,
  page_views      INTEGER NOT NULL DEFAULT 0,
  add_to_carts    INTEGER NOT NULL DEFAULT 0,
  conversions     INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (store_id, date)
);

CREATE INDEX IF NOT EXISTS idx_merchant_daily_analytics_date
  ON public.merchant_daily_analytics(date DESC);

-- ─── Brand approval: auto-publish + activity ─────────────────────────────────
CREATE OR REPLACE FUNCTION private.on_brand_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'approved') THEN
    NEW.approved_at := COALESCE(NEW.approved_at, NOW());
    INSERT INTO public.commerce_activity_events (activity_type, actor_id, store_id, brand_id, payload)
    VALUES (
      'brand_approved',
      NEW.approved_by,
      NEW.store_id,
      NEW.id,
      jsonb_build_object('brand_name', NEW.name, 'brand_slug', NEW.slug)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS brands_status_change ON public.brands;
CREATE TRIGGER brands_status_change
  BEFORE UPDATE OF status ON public.brands
  FOR EACH ROW EXECUTE FUNCTION private.on_brand_status_change();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_daily_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read countries" ON public.countries;
CREATE POLICY "Public read countries" ON public.countries FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public read approved brands" ON public.brands;
CREATE POLICY "Public read approved brands" ON public.brands FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Merchants manage own brands" ON public.brands;
CREATE POLICY "Merchants manage own brands" ON public.brands FOR ALL
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = brands.store_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = brands.store_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage brands" ON public.brands;
CREATE POLICY "Admins manage brands" ON public.brands FOR ALL
  USING (private.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Public read active variants" ON public.product_variants;
CREATE POLICY "Public read active variants" ON public.product_variants FOR SELECT
  USING (
    is_active = TRUE AND EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_variants.product_id AND p.is_active AND s.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Merchants manage variants" ON public.product_variants;
CREATE POLICY "Merchants manage variants" ON public.product_variants FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.products p JOIN public.stores s ON s.id = p.store_id
    WHERE p.id = product_variants.product_id AND s.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Public read store branding" ON public.store_branding;
CREATE POLICY "Public read store branding" ON public.store_branding FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Merchants manage store branding" ON public.store_branding;
CREATE POLICY "Merchants manage store branding" ON public.store_branding FOR ALL
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_branding.store_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage store branding" ON public.store_branding;
CREATE POLICY "Admins manage store branding" ON public.store_branding FOR ALL
  USING (private.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Public read verified stores" ON public.store_verifications;
CREATE POLICY "Public read verified stores" ON public.store_verifications FOR SELECT
  USING (status = 'verified');

DROP POLICY IF EXISTS "Merchants read own verification" ON public.store_verifications;
CREATE POLICY "Merchants read own verification" ON public.store_verifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_verifications.store_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Merchants submit verification" ON public.store_verifications;
CREATE POLICY "Merchants submit verification" ON public.store_verifications FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_verifications.store_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage verifications" ON public.store_verifications;
CREATE POLICY "Admins manage verifications" ON public.store_verifications FOR ALL
  USING (private.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Customers manage followers" ON public.store_followers;
CREATE POLICY "Customers manage followers" ON public.store_followers FOR ALL
  USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Public read follower counts" ON public.store_followers;
CREATE POLICY "Public read follower counts" ON public.store_followers FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Customers manage store favorites" ON public.store_favorites;
CREATE POLICY "Customers manage store favorites" ON public.store_favorites FOR ALL
  USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Public read subscription plans" ON public.subscription_plans;
CREATE POLICY "Public read subscription plans" ON public.subscription_plans FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Merchants manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Merchants manage subscription plans" ON public.subscription_plans FOR ALL
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = subscription_plans.store_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Customers manage own subscriptions" ON public.customer_subscriptions;
CREATE POLICY "Customers manage own subscriptions" ON public.customer_subscriptions FOR SELECT
  USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Merchants read store subscriptions" ON public.customer_subscriptions;
CREATE POLICY "Merchants read store subscriptions" ON public.customer_subscriptions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = customer_subscriptions.store_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Insert analytics events" ON public.commerce_analytics_events;
CREATE POLICY "Insert analytics events" ON public.commerce_analytics_events FOR INSERT
  WITH CHECK (customer_id IS NULL OR customer_id = auth.uid());

DROP POLICY IF EXISTS "Merchants read store analytics" ON public.commerce_analytics_events;
CREATE POLICY "Merchants read store analytics" ON public.commerce_analytics_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = commerce_analytics_events.store_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Admins read analytics" ON public.commerce_analytics_events;
CREATE POLICY "Admins read analytics" ON public.commerce_analytics_events FOR SELECT
  USING (private.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Public read activity feed" ON public.commerce_activity_events;
CREATE POLICY "Public read activity feed" ON public.commerce_activity_events FOR SELECT
  USING (is_public = TRUE);

DROP POLICY IF EXISTS "Admins manage activity" ON public.commerce_activity_events;
CREATE POLICY "Admins manage activity" ON public.commerce_activity_events FOR ALL
  USING (private.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Merchants read store analytics rollup" ON public.merchant_daily_analytics;
CREATE POLICY "Merchants read store analytics rollup" ON public.merchant_daily_analytics FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = merchant_daily_analytics.store_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Admins read merchant analytics rollup" ON public.merchant_daily_analytics;
CREATE POLICY "Admins read merchant analytics rollup" ON public.merchant_daily_analytics FOR SELECT
  USING (private.current_user_role() = 'admin');

-- ─── Storage buckets ─────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('store-banners', 'store-banners', true, 8388608, ARRAY['image/jpeg','image/png','image/webp']),
  ('brand-logos', 'brand-logos', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('category-images', 'category-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('user-avatars', 'user-avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp']),
  ('review-images', 'review-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies (idempotent pattern)
DO $$ BEGIN
  CREATE POLICY "Auth upload store banners" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'store-banners');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Public read store banners" ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'store-banners');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth upload brand logos" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'brand-logos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Public read brand logos" ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'brand-logos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth upload category images" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'category-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Public read category images" ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'category-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth upload avatars" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'user-avatars');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth upload review images" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'review-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Public read review images" ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'review-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Realtime publication ────────────────────────────────────────────────────
DO $$
DECLARE t TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN RETURN; END IF;
  FOREACH t IN ARRAY ARRAY[
    'brands', 'products', 'stores', 'orders', 'store_followers',
    'commerce_activity_events', 'merchant_daily_analytics'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
