-- Nexar Commerce: statistics engine (database-computed, never hardcoded)

-- ─── Live metrics broadcast row (single row for realtime subscriptions) ───────
CREATE TABLE IF NOT EXISTS public.commerce_live_metrics (
  id          TEXT PRIMARY KEY DEFAULT 'global',
  payload     JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.commerce_live_metrics (id, payload)
VALUES ('global', '{}'::JSONB)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.commerce_live_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read live metrics" ON public.commerce_live_metrics;
CREATE POLICY "Public read live metrics" ON public.commerce_live_metrics FOR SELECT USING (TRUE);

-- ─── Compute global statistics from real tables ────────────────────────────────
CREATE OR REPLACE FUNCTION public.compute_global_commerce_statistics()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nxr_payments BIGINT;
  v_usdt_payments BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_nxr_payments
  FROM public.payment_sessions ps
  WHERE ps.status IN ('paid', 'completed') AND UPPER(ps.currency) = 'NXR';

  SELECT COUNT(*) INTO v_usdt_payments
  FROM public.payment_sessions ps
  WHERE ps.status IN ('paid', 'completed') AND UPPER(ps.currency) IN ('USDT', 'USD');

  RETURN jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_merchants', (SELECT COUNT(*) FROM public.profiles WHERE role = 'merchant'),
    'total_customers', (SELECT COUNT(*) FROM public.profiles WHERE role = 'customer'),
    'verified_stores', (
      SELECT COUNT(DISTINCT sv.store_id)
      FROM public.store_verifications sv WHERE sv.status = 'verified'
    ),
    'total_products', (SELECT COUNT(*) FROM public.products WHERE is_active = TRUE),
    'total_orders', (SELECT COUNT(*) FROM public.orders),
    'paid_orders', (SELECT COUNT(*) FROM public.orders WHERE status = 'paid'),
    'sales_volume_usd', COALESCE((
      SELECT SUM(o.subtotal) FROM public.orders o WHERE o.status = 'paid'
    ), 0),
    'nxr_payments', v_nxr_payments,
    'usdt_payments', v_usdt_payments,
    'countries_active', (SELECT COUNT(DISTINCT country_code) FROM public.commerce_analytics_events WHERE country_code IS NOT NULL),
    'new_stores_7d', (SELECT COUNT(*) FROM public.stores WHERE created_at >= NOW() - INTERVAL '7 days'),
    'computed_at', NOW()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_global_commerce_statistics()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.compute_global_commerce_statistics();
$$;

GRANT EXECUTE ON FUNCTION public.get_global_commerce_statistics() TO anon, authenticated, service_role;

-- ─── Marketplace feed statistics ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_marketplace_statistics(p_limit INTEGER DEFAULT 12)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'latest_products', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT p.id, p.name, p.slug, p.price, p.currency, p.image_url, p.created_at,
               s.id AS store_id, s.name AS store_name, s.slug AS store_slug
        FROM public.products p
        JOIN public.stores s ON s.id = p.store_id
        WHERE p.is_active AND s.status = 'active' AND s.mode = 'marketplace'
        ORDER BY p.created_at DESC LIMIT p_limit
      ) t
    ), '[]'::JSONB),
    'trending_products', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT p.id, p.name, p.slug, p.price, p.currency, p.image_url,
               COUNT(oi.id) AS units_sold,
               SUM(oi.line_total) AS revenue
        FROM public.order_items oi
        JOIN public.orders o ON o.id = oi.order_id AND o.status = 'paid'
          AND o.paid_at >= NOW() - INTERVAL '30 days'
        JOIN public.products p ON p.id = oi.product_id
        GROUP BY p.id, p.name, p.slug, p.price, p.currency, p.image_url
        ORDER BY units_sold DESC, revenue DESC
        LIMIT p_limit
      ) t
    ), '[]'::JSONB),
    'featured_stores', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT s.id, s.name, s.slug, s.logo_url, sb.featured, sb.tagline, sb.banner_url
        FROM public.stores s
        LEFT JOIN public.store_branding sb ON sb.store_id = s.id
        WHERE s.status = 'active' AND s.mode = 'marketplace'
          AND (sb.featured = TRUE OR sb.store_id IS NOT NULL)
        ORDER BY sb.featured DESC NULLS LAST, s.created_at DESC
        LIMIT p_limit
      ) t
    ), '[]'::JSONB),
    'approved_brands', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT b.id, b.name, b.slug, b.logo_url, b.store_id, b.approved_at
        FROM public.brands b
        WHERE b.status = 'approved'
        ORDER BY b.approved_at DESC NULLS LAST
        LIMIT p_limit
      ) t
    ), '[]'::JSONB),
    'computed_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_statistics(INTEGER) TO anon, authenticated, service_role;

-- ─── Merchant analytics dashboard ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_merchant_commerce_analytics(p_store_id UUID, p_days INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since TIMESTAMPTZ := NOW() - make_interval(days => GREATEST(p_days, 1));
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = p_store_id
      AND (s.owner_id = auth.uid() OR private.current_user_role() = 'admin')
  ) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  RETURN jsonb_build_object(
    'revenue', COALESCE((
      SELECT SUM(o.subtotal) FROM public.orders o
      WHERE o.store_id = p_store_id AND o.status = 'paid' AND COALESCE(o.paid_at, o.created_at) >= v_since
    ), 0),
    'orders', (
      SELECT COUNT(*) FROM public.orders o
      WHERE o.store_id = p_store_id AND o.created_at >= v_since
    ),
    'customers', (
      SELECT COUNT(DISTINCT o.customer_id) FROM public.orders o
      WHERE o.store_id = p_store_id AND o.created_at >= v_since
    ),
    'page_views', (
      SELECT COUNT(*) FROM public.commerce_analytics_events e
      WHERE e.store_id = p_store_id AND e.event_type = 'page_view' AND e.created_at >= v_since
    ),
    'add_to_carts', (
      SELECT COUNT(*) FROM public.commerce_analytics_events e
      WHERE e.store_id = p_store_id AND e.event_type = 'add_to_cart' AND e.created_at >= v_since
    ),
    'conversions', (
      SELECT COUNT(*) FROM public.commerce_analytics_events e
      WHERE e.store_id = p_store_id AND e.event_type = 'purchase' AND e.created_at >= v_since
    ),
    'conversion_rate', CASE
      WHEN (SELECT COUNT(*) FROM public.commerce_analytics_events e
            WHERE e.store_id = p_store_id AND e.event_type = 'page_view' AND e.created_at >= v_since) = 0
      THEN 0
      ELSE ROUND(
        (SELECT COUNT(*)::NUMERIC FROM public.commerce_analytics_events e
         WHERE e.store_id = p_store_id AND e.event_type = 'purchase' AND e.created_at >= v_since)
        /
        (SELECT COUNT(*)::NUMERIC FROM public.commerce_analytics_events e
         WHERE e.store_id = p_store_id AND e.event_type = 'page_view' AND e.created_at >= v_since)
        * 100, 2)
    END,
    'sales_chart', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT mda.date, mda.revenue, mda.orders_count, mda.page_views, mda.conversions
        FROM public.merchant_daily_analytics mda
        WHERE mda.store_id = p_store_id AND mda.date >= (CURRENT_DATE - p_days)
        ORDER BY mda.date ASC
      ) t
    ), '[]'::JSONB),
    'top_products', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT oi.product_id, oi.product_name,
               SUM(oi.quantity) AS units_sold,
               SUM(oi.line_total) AS revenue
        FROM public.order_items oi
        JOIN public.orders o ON o.id = oi.order_id
        WHERE o.store_id = p_store_id AND o.status = 'paid'
          AND COALESCE(o.paid_at, o.created_at) >= v_since
        GROUP BY oi.product_id, oi.product_name
        ORDER BY revenue DESC
        LIMIT 10
      ) t
    ), '[]'::JSONB),
    'computed_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_merchant_commerce_analytics(UUID, INTEGER) TO authenticated, service_role;

-- ─── Rollup merchant daily analytics on paid order ───────────────────────────
CREATE OR REPLACE FUNCTION private.rollup_merchant_daily_on_order_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date DATE := (COALESCE(NEW.paid_at, NEW.created_at) AT TIME ZONE 'UTC')::DATE;
BEGIN
  IF NEW.status = 'paid' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'paid') THEN
    INSERT INTO public.merchant_daily_analytics (store_id, date, revenue, orders_count, customers_count, conversions)
    VALUES (NEW.store_id, v_date, NEW.subtotal, 1, 1, 1)
    ON CONFLICT (store_id, date) DO UPDATE SET
      revenue = merchant_daily_analytics.revenue + EXCLUDED.revenue,
      orders_count = merchant_daily_analytics.orders_count + 1,
      customers_count = merchant_daily_analytics.customers_count,
      conversions = merchant_daily_analytics.conversions + 1,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_rollup_merchant_daily ON public.orders;
CREATE TRIGGER orders_rollup_merchant_daily
  AFTER INSERT OR UPDATE OF status, paid_at ON public.orders
  FOR EACH ROW EXECUTE FUNCTION private.rollup_merchant_daily_on_order_paid();

-- ─── Refresh live metrics broadcast (realtime dashboard) ───────────────────────
CREATE OR REPLACE FUNCTION private.refresh_commerce_live_metrics()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.commerce_live_metrics
  SET payload = public.compute_global_commerce_statistics()
      || jsonb_build_object('marketplace', public.get_marketplace_statistics(8)),
      updated_at = NOW()
  WHERE id = 'global';
END;
$$;

CREATE OR REPLACE FUNCTION private.trigger_refresh_commerce_live_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM private.refresh_commerce_live_metrics();
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS refresh_live_metrics_profiles ON public.profiles;
CREATE TRIGGER refresh_live_metrics_profiles
  AFTER INSERT ON public.profiles
  FOR EACH STATEMENT EXECUTE FUNCTION private.trigger_refresh_commerce_live_metrics();

DROP TRIGGER IF EXISTS refresh_live_metrics_stores ON public.stores;
CREATE TRIGGER refresh_live_metrics_stores
  AFTER INSERT OR UPDATE OF status ON public.stores
  FOR EACH STATEMENT EXECUTE FUNCTION private.trigger_refresh_commerce_live_metrics();

DROP TRIGGER IF EXISTS refresh_live_metrics_products ON public.products;
CREATE TRIGGER refresh_live_metrics_products
  AFTER INSERT OR UPDATE OF is_active ON public.products
  FOR EACH STATEMENT EXECUTE FUNCTION private.trigger_refresh_commerce_live_metrics();

DROP TRIGGER IF EXISTS refresh_live_metrics_orders ON public.orders;
CREATE TRIGGER refresh_live_metrics_orders
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH STATEMENT EXECUTE FUNCTION private.trigger_refresh_commerce_live_metrics();

DROP TRIGGER IF EXISTS refresh_live_metrics_payments ON public.payment_sessions;
CREATE TRIGGER refresh_live_metrics_payments
  AFTER INSERT OR UPDATE OF status ON public.payment_sessions
  FOR EACH STATEMENT EXECUTE FUNCTION private.trigger_refresh_commerce_live_metrics();

-- Initial populate
SELECT private.refresh_commerce_live_metrics();

-- Realtime on live metrics
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN RETURN; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'commerce_live_metrics'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.commerce_live_metrics;
  END IF;
END $$;

-- Admin brand approval RPC
CREATE OR REPLACE FUNCTION public.approve_brand(p_brand_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF private.current_user_role() <> 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Forbidden');
  END IF;

  UPDATE public.brands
  SET status = 'approved', approved_by = auth.uid(), approved_at = NOW(), updated_at = NOW()
  WHERE id = p_brand_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Brand not found or not pending');
  END IF;

  PERFORM private.refresh_commerce_live_metrics();
  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_brand(UUID) TO authenticated, service_role;
