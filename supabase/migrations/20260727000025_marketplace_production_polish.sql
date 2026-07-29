-- Marketplace production polish: reviews, wishlist, fulfillment, reports

-- ─── Fulfillment status ──────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.fulfillment_status AS ENUM (
    'pending',
    'processing',
    'shipped',
    'delivered'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fulfillment_status public.fulfillment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(20, 8) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_fulfillment ON public.orders(fulfillment_status)
  WHERE status = 'paid';

-- ─── Free shipping coupon type ───────────────────────────────────────────────
ALTER TYPE public.coupon_type ADD VALUE IF NOT EXISTS 'free_shipping';

-- ─── Review moderation status ────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.review_target AS ENUM ('product', 'store');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Product reviews ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id        UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title           TEXT,
  body            TEXT NOT NULL,
  images          JSONB NOT NULL DEFAULT '[]',
  status          public.review_status NOT NULL DEFAULT 'approved',
  merchant_reply  TEXT,
  merchant_reply_at TIMESTAMPTZ,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  helpful_count   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_store ON public.product_reviews(store_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_customer ON public.product_reviews(customer_id);

DROP TRIGGER IF EXISTS product_reviews_updated_at ON public.product_reviews;
CREATE TRIGGER product_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ─── Store reviews ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.store_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id        UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title           TEXT,
  body            TEXT NOT NULL,
  images          JSONB NOT NULL DEFAULT '[]',
  status          public.review_status NOT NULL DEFAULT 'approved',
  merchant_reply  TEXT,
  merchant_reply_at TIMESTAMPTZ,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_store_reviews_store ON public.store_reviews(store_id, status, created_at DESC);

DROP TRIGGER IF EXISTS store_reviews_updated_at ON public.store_reviews;
CREATE TRIGGER store_reviews_updated_at
  BEFORE UPDATE ON public.store_reviews
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ─── Wishlist ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_customer ON public.wishlist_items(customer_id, created_at DESC);

-- ─── Recently viewed (persisted) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recently_viewed_products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_recently_viewed ON public.recently_viewed_products(customer_id, viewed_at DESC);

-- ─── Content reports ─────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.report_target AS ENUM ('product', 'store', 'product_review', 'store_review');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.content_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type public.report_target NOT NULL,
  target_id   UUID NOT NULL,
  reason      TEXT NOT NULL,
  details     TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reports_target ON public.content_reports(target_type, target_id);

-- ─── Store trust metrics view ────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.store_trust_metrics AS
SELECT
  s.id AS store_id,
  s.created_at AS store_created_at,
  EXTRACT(YEAR FROM AGE(NOW(), s.created_at))::INT AS years_active,
  COALESCE(paid_orders.cnt, 0) AS total_orders,
  COALESCE(pr.review_count, 0) + COALESCE(sr.review_count, 0) AS total_reviews,
  COALESCE(pr.avg_rating, sr.avg_rating, 0)::NUMERIC(3,2) AS avg_rating,
  COALESCE(replied.replied_count, 0)::NUMERIC / NULLIF(COALESCE(pr.review_count, 0) + COALESCE(sr.review_count, 0), 0) * 100 AS response_rate,
  replied.avg_response_hours AS avg_response_hours
FROM public.stores s
LEFT JOIN (
  SELECT store_id, COUNT(*) AS cnt FROM public.orders WHERE status = 'paid' GROUP BY store_id
) paid_orders ON paid_orders.store_id = s.id
LEFT JOIN (
  SELECT store_id, COUNT(*) AS review_count, AVG(rating) AS avg_rating
  FROM public.product_reviews WHERE status = 'approved' GROUP BY store_id
) pr ON pr.store_id = s.id
LEFT JOIN (
  SELECT store_id, COUNT(*) AS review_count, AVG(rating) AS avg_rating
  FROM public.store_reviews WHERE status = 'approved' GROUP BY store_id
) sr ON sr.store_id = s.id
LEFT JOIN (
  SELECT store_id,
    COUNT(*) FILTER (WHERE merchant_reply IS NOT NULL) AS replied_count,
    AVG(EXTRACT(EPOCH FROM (merchant_reply_at - created_at)) / 3600)
      FILTER (WHERE merchant_reply_at IS NOT NULL) AS avg_response_hours
  FROM (
    SELECT store_id, merchant_reply, merchant_reply_at, created_at FROM public.product_reviews
    UNION ALL
    SELECT store_id, merchant_reply, merchant_reply_at, created_at FROM public.store_reviews
  ) all_reviews
  GROUP BY store_id
) replied ON replied.store_id = s.id;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.current_user_role() = 'admin';
$$;

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recently_viewed_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Product reviews
DROP POLICY IF EXISTS product_reviews_select ON public.product_reviews;
CREATE POLICY product_reviews_select ON public.product_reviews FOR SELECT USING (
  status = 'approved' OR customer_id = auth.uid() OR private.is_admin() OR
  EXISTS (SELECT 1 FROM public.stores st WHERE st.id = store_id AND st.owner_id = auth.uid())
);
DROP POLICY IF EXISTS product_reviews_insert ON public.product_reviews;
CREATE POLICY product_reviews_insert ON public.product_reviews FOR INSERT WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS product_reviews_update ON public.product_reviews;
CREATE POLICY product_reviews_update ON public.product_reviews FOR UPDATE USING (
  customer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.stores st WHERE st.id = store_id AND st.owner_id = auth.uid()) OR
  private.is_admin()
);

-- Store reviews
DROP POLICY IF EXISTS store_reviews_select ON public.store_reviews;
CREATE POLICY store_reviews_select ON public.store_reviews FOR SELECT USING (
  status = 'approved' OR customer_id = auth.uid() OR private.is_admin() OR
  EXISTS (SELECT 1 FROM public.stores st WHERE st.id = store_id AND st.owner_id = auth.uid())
);
DROP POLICY IF EXISTS store_reviews_insert ON public.store_reviews;
CREATE POLICY store_reviews_insert ON public.store_reviews FOR INSERT WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS store_reviews_update ON public.store_reviews;
CREATE POLICY store_reviews_update ON public.store_reviews FOR UPDATE USING (
  customer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.stores st WHERE st.id = store_id AND st.owner_id = auth.uid()) OR
  private.is_admin()
);

-- Wishlist
DROP POLICY IF EXISTS wishlist_select ON public.wishlist_items;
CREATE POLICY wishlist_select ON public.wishlist_items FOR SELECT USING (customer_id = auth.uid());
DROP POLICY IF EXISTS wishlist_insert ON public.wishlist_items;
CREATE POLICY wishlist_insert ON public.wishlist_items FOR INSERT WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS wishlist_delete ON public.wishlist_items;
CREATE POLICY wishlist_delete ON public.wishlist_items FOR DELETE USING (customer_id = auth.uid());

-- Recently viewed
DROP POLICY IF EXISTS recently_viewed_select ON public.recently_viewed_products;
CREATE POLICY recently_viewed_select ON public.recently_viewed_products FOR SELECT USING (customer_id = auth.uid());
DROP POLICY IF EXISTS recently_viewed_upsert ON public.recently_viewed_products;
CREATE POLICY recently_viewed_upsert ON public.recently_viewed_products FOR ALL USING (customer_id = auth.uid());

-- Content reports
DROP POLICY IF EXISTS content_reports_insert ON public.content_reports;
CREATE POLICY content_reports_insert ON public.content_reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
DROP POLICY IF EXISTS content_reports_select ON public.content_reports;
CREATE POLICY content_reports_select ON public.content_reports FOR SELECT USING (
  reporter_id = auth.uid() OR private.is_admin()
);
DROP POLICY IF EXISTS content_reports_admin ON public.content_reports;
CREATE POLICY content_reports_admin ON public.content_reports FOR UPDATE USING (private.is_admin());

-- ─── Update order fulfillment RPC ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_order_fulfillment(
  p_order_id UUID,
  p_fulfillment_status public.fulfillment_status
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
  v_customer_id UUID;
BEGIN
  SELECT store_id, customer_id INTO v_store_id, v_customer_id
  FROM public.orders WHERE id = p_order_id AND status = 'paid';

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Order not found or not paid';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores WHERE id = v_store_id AND owner_id = auth.uid()
  ) AND NOT private.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.orders SET
    fulfillment_status = p_fulfillment_status,
    shipped_at = CASE WHEN p_fulfillment_status = 'shipped' AND shipped_at IS NULL THEN NOW() ELSE shipped_at END,
    delivered_at = CASE WHEN p_fulfillment_status = 'delivered' AND delivered_at IS NULL THEN NOW() ELSE delivered_at END
  WHERE id = p_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_fulfillment(UUID, public.fulfillment_status) TO authenticated;
