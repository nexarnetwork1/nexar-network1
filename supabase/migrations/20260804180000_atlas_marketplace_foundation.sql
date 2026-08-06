-- ATLAS Marketplace foundation (additive, backward-compatible)
-- Commerce Engine — sales channel only. Does NOT own Product or Store masters.
-- References: products, stores, businesses, orders, carts, wishlists, reviews.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.marketplace_selling_type AS ENUM (
  'physical', 'digital', 'service', 'rental', 'subscription',
  'wholesale', 'auction', 'nft'
);

CREATE TYPE public.marketplace_listing_status AS ENUM (
  'draft', 'pending_review', 'published', 'paused', 'archived', 'rejected'
);

CREATE TYPE public.marketplace_checkout_status AS ENUM (
  'open', 'processing', 'completed', 'abandoned', 'cancelled'
);

CREATE TYPE public.marketplace_shipment_status AS ENUM (
  'pending', 'packed', 'shipped', 'in_transit', 'delivered', 'returned', 'cancelled'
);

CREATE TYPE public.marketplace_campaign_status AS ENUM (
  'draft', 'scheduled', 'active', 'ended', 'cancelled'
);

CREATE TYPE public.marketplace_ad_placement AS ENUM (
  'home', 'search', 'category', 'product', 'storefront', 'pulse'
);

CREATE TYPE public.marketplace_monetization_kind AS ENUM (
  'commission', 'sponsored_product', 'sponsored_business',
  'premium_store', 'premium_analytics', 'featured_listing'
);

CREATE TYPE public.marketplace_payment_method AS ENUM (
  'wallet', 'card', 'bank', 'crypto', 'nxr', 'cash', 'split'
);

-- ---------------------------------------------------------------------------
-- Storefront (one per business — presentation channel over Store master)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_marketplace_storefronts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  display_name TEXT NOT NULL,
  tagline TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  follower_count INTEGER NOT NULL DEFAULT 0,
  listing_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_mkt_storefronts_business
  ON public.atlas_marketplace_storefronts(business_id);
CREATE INDEX IF NOT EXISTS idx_mkt_storefronts_store
  ON public.atlas_marketplace_storefronts(store_id);

-- ---------------------------------------------------------------------------
-- Listings (channel projection — NEVER a Product master)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID NOT NULL REFERENCES public.atlas_marketplace_storefronts(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  -- Product master reference (businessHub). Nullable for service-only listings.
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  selling_type public.marketplace_selling_type NOT NULL DEFAULT 'physical',
  status public.marketplace_listing_status NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT,
  ai_description TEXT,
  price NUMERIC(20, 8),
  currency TEXT NOT NULL DEFAULT 'USD',
  compare_at_price NUMERIC(20, 8),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_sponsored BOOLEAN NOT NULL DEFAULT FALSE,
  category_id UUID REFERENCES public.marketplace_categories(id) ON DELETE SET NULL,
  collection_id UUID,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (storefront_id, slug),
  CONSTRAINT marketplace_listings_product_or_service CHECK (
    product_id IS NOT NULL OR selling_type IN ('service', 'rental', 'subscription')
  )
);

CREATE INDEX IF NOT EXISTS idx_mkt_listings_storefront
  ON public.atlas_marketplace_listings(storefront_id, status);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_business
  ON public.atlas_marketplace_listings(business_id);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_product
  ON public.atlas_marketplace_listings(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mkt_listings_published
  ON public.atlas_marketplace_listings(published_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mkt_listings_fts
  ON public.atlas_marketplace_listings USING gin (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, ''))
  );

-- ---------------------------------------------------------------------------
-- Offers (time-bound channel deals on listings)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_marketplace_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID NOT NULL REFERENCES public.atlas_marketplace_storefronts(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.atlas_marketplace_listings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  discount_percent NUMERIC(5, 2),
  discount_amount NUMERIC(20, 8),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_offers_listing
  ON public.atlas_marketplace_offers(listing_id) WHERE is_active = TRUE;

-- ---------------------------------------------------------------------------
-- Flash sales & campaigns & collections
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_marketplace_flash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID REFERENCES public.atlas_marketplace_storefronts(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status public.marketplace_campaign_status NOT NULL DEFAULT 'scheduled',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_marketplace_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  storefront_id UUID REFERENCES public.atlas_marketplace_storefronts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  status public.marketplace_campaign_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  budget NUMERIC(20, 8),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_marketplace_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id UUID REFERENCES public.atlas_marketplace_storefronts(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (storefront_id, slug)
);

CREATE TABLE IF NOT EXISTS public.atlas_marketplace_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.atlas_marketplace_collections(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.atlas_marketplace_listings(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (collection_id, listing_id)
);

ALTER TABLE public.atlas_marketplace_listings
  DROP CONSTRAINT IF EXISTS fk_mkt_listings_collection;
ALTER TABLE public.atlas_marketplace_listings
  ADD CONSTRAINT fk_mkt_listings_collection
  FOREIGN KEY (collection_id) REFERENCES public.atlas_marketplace_collections(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_marketplace_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.atlas_marketplace_listing_tags (
  listing_id UUID NOT NULL REFERENCES public.atlas_marketplace_listings(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.atlas_marketplace_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- Checkout sessions (channel checkout — Orders remain orders context)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_marketplace_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  storefront_id UUID REFERENCES public.atlas_marketplace_storefronts(id) ON DELETE SET NULL,
  buyer_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cart_id UUID REFERENCES public.carts(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status public.marketplace_checkout_status NOT NULL DEFAULT 'open',
  payment_method public.marketplace_payment_method,
  coupon_code TEXT,
  subtotal NUMERIC(20, 8),
  discount_total NUMERIC(20, 8) NOT NULL DEFAULT 0,
  total NUMERIC(20, 8),
  currency TEXT NOT NULL DEFAULT 'USD',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mkt_checkouts_buyer
  ON public.atlas_marketplace_checkouts(buyer_user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Shipments (order fulfillment tracking — references orders)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_marketplace_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  status public.marketplace_shipment_status NOT NULL DEFAULT 'pending',
  carrier TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_shipments_order
  ON public.atlas_marketplace_shipments(order_id);

-- ---------------------------------------------------------------------------
-- Product favorites (store_favorites already exists for stores)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_marketplace_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.atlas_marketplace_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, listing_id)
);

-- ---------------------------------------------------------------------------
-- Commerce recommendations (PDP / cart — distinct from Pulse/AI)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_marketplace_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.atlas_marketplace_listings(id) ON DELETE CASCADE,
  reason TEXT,
  score REAL NOT NULL DEFAULT 0,
  context TEXT NOT NULL DEFAULT 'general',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_recs_user
  ON public.atlas_marketplace_recommendations(user_id, score DESC);

-- ---------------------------------------------------------------------------
-- Advertisements / sponsored placements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_marketplace_advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.atlas_marketplace_listings(id) ON DELETE CASCADE,
  storefront_id UUID REFERENCES public.atlas_marketplace_storefronts(id) ON DELETE CASCADE,
  placement public.marketplace_ad_placement NOT NULL DEFAULT 'home',
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  budget NUMERIC(20, 8),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Monetization ledger (commission / sponsored / premium)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atlas_marketplace_monetization_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  storefront_id UUID REFERENCES public.atlas_marketplace_storefronts(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.atlas_marketplace_listings(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  kind public.marketplace_monetization_kind NOT NULL,
  amount NUMERIC(20, 8) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_monetization_business
  ON public.atlas_marketplace_monetization_ledger(business_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- AI commerce action log (contracts — Atlas AI plugs in later)
-- ---------------------------------------------------------------------------
CREATE TYPE public.marketplace_ai_action AS ENUM (
  'generate_description', 'generate_seo', 'suggest_price',
  'predict_sales', 'recommend_products', 'detect_fraud', 'optimize_inventory'
);

CREATE TABLE IF NOT EXISTS public.atlas_marketplace_ai_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.atlas_marketplace_listings(id) ON DELETE SET NULL,
  action public.marketplace_ai_action NOT NULL,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Auto-provision storefront when Business is created
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.ensure_atlas_marketplace_for_business()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sid UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.atlas_marketplace_storefronts WHERE business_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  SELECT id INTO sid FROM public.stores
  WHERE business_id = NEW.id OR id = NEW.primary_store_id
  LIMIT 1;

  INSERT INTO public.atlas_marketplace_storefronts (
    business_id, store_id, slug, display_name, tagline, metadata
  ) VALUES (
    NEW.id,
    sid,
    NEW.slug || '-shop',
    NEW.display_name,
    'Official storefront on ATLAS Marketplace',
    jsonb_build_object('source', 'business.created')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_ensure_marketplace ON public.businesses;
CREATE TRIGGER businesses_ensure_marketplace
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION private.ensure_atlas_marketplace_for_business();

-- Backfill storefronts for existing businesses
DO $$
DECLARE r RECORD; sid UUID;
BEGIN
  FOR r IN SELECT * FROM public.businesses WHERE deleted_at IS NULL LOOP
    IF EXISTS (SELECT 1 FROM public.atlas_marketplace_storefronts WHERE business_id = r.id) THEN
      CONTINUE;
    END IF;
    SELECT id INTO sid FROM public.stores
    WHERE business_id = r.id OR id = r.primary_store_id
    LIMIT 1;
    INSERT INTO public.atlas_marketplace_storefronts (
      business_id, store_id, slug, display_name, tagline
    ) VALUES (
      r.id, sid, r.slug || '-shop', r.display_name, 'Official storefront on ATLAS Marketplace'
    );
  END LOOP;
END $$;

-- When product published, ensure a draft listing exists (idempotent via unique product+storefront)
CREATE OR REPLACE FUNCTION private.ensure_listing_for_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sf_id UUID;
  biz_id UUID;
  listing_slug TEXT;
BEGIN
  IF NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  biz_id := NEW.business_id;
  IF biz_id IS NULL THEN
    SELECT business_id INTO biz_id FROM public.stores WHERE id = NEW.store_id;
  END IF;
  IF biz_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO sf_id FROM public.atlas_marketplace_storefronts
  WHERE business_id = biz_id AND deleted_at IS NULL
  LIMIT 1;
  IF sf_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.atlas_marketplace_listings
    WHERE product_id = NEW.id AND storefront_id = sf_id AND deleted_at IS NULL
  ) THEN
    UPDATE public.atlas_marketplace_listings
    SET title = NEW.name,
        price = NEW.price,
        currency = NEW.currency,
        status = CASE WHEN NEW.is_active THEN 'published'::public.marketplace_listing_status ELSE status END,
        published_at = CASE WHEN NEW.is_active AND published_at IS NULL THEN NOW() ELSE published_at END,
        updated_at = NOW()
    WHERE product_id = NEW.id AND storefront_id = sf_id;
    RETURN NEW;
  END IF;

  listing_slug := lower(regexp_replace(coalesce(NEW.name, 'product'), '[^a-zA-Z0-9]+', '-', 'g'))
    || '-' || substr(NEW.id::text, 1, 8);

  INSERT INTO public.atlas_marketplace_listings (
    storefront_id, business_id, product_id, selling_type, status,
    title, slug, summary, price, currency, published_at
  ) VALUES (
    sf_id, biz_id, NEW.id, 'physical',
    CASE WHEN NEW.is_active THEN 'published'::public.marketplace_listing_status ELSE 'draft'::public.marketplace_listing_status END,
    NEW.name, listing_slug, left(coalesce(NEW.description, ''), 500),
    NEW.price, NEW.currency,
    CASE WHEN NEW.is_active THEN NOW() ELSE NULL END
  );

  UPDATE public.atlas_marketplace_storefronts
  SET listing_count = listing_count + 1, updated_at = NOW()
  WHERE id = sf_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_ensure_marketplace_listing ON public.products;
CREATE TRIGGER products_ensure_marketplace_listing
  AFTER INSERT OR UPDATE OF name, description, price, currency, is_active, business_id
  ON public.products
  FOR EACH ROW EXECUTE FUNCTION private.ensure_listing_for_product();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.is_marketplace_storefront_member(p_storefront_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.atlas_marketplace_storefronts sf
    JOIN public.business_memberships bm ON bm.business_id = sf.business_id
    WHERE sf.id = p_storefront_id
      AND bm.user_id = auth.uid()
      AND bm.revoked_at IS NULL
      AND bm.status = 'active'::public.business_member_status
  ) OR EXISTS (
    SELECT 1 FROM public.atlas_marketplace_storefronts sf
    JOIN public.businesses b ON b.id = sf.business_id
    WHERE sf.id = p_storefront_id AND b.owner_user_id = auth.uid()
  ) OR private.current_user_role() = 'admin'::public.user_role;
$$;

ALTER TABLE public.atlas_marketplace_storefronts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_marketplace_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_marketplace_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_marketplace_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_marketplace_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_marketplace_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_marketplace_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_marketplace_advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_marketplace_monetization_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published storefronts" ON public.atlas_marketplace_storefronts
  FOR SELECT USING (is_published = TRUE AND deleted_at IS NULL OR private.is_marketplace_storefront_member(id));

CREATE POLICY "Public read published listings" ON public.atlas_marketplace_listings
  FOR SELECT USING (
    (status = 'published' AND deleted_at IS NULL)
    OR private.is_marketplace_storefront_member(storefront_id)
  );

CREATE POLICY "Members read offers" ON public.atlas_marketplace_offers
  FOR SELECT USING (private.is_marketplace_storefront_member(storefront_id) OR is_active = TRUE);

CREATE POLICY "Users read own favorites" ON public.atlas_marketplace_favorites
  FOR SELECT USING (user_id = auth.uid() OR private.current_user_role() = 'admin'::public.user_role);

CREATE POLICY "Users read own checkouts" ON public.atlas_marketplace_checkouts
  FOR SELECT USING (buyer_user_id = auth.uid() OR private.current_user_role() = 'admin'::public.user_role);
