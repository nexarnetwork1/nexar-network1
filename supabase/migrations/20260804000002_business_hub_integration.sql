-- Business Hub integration: triggers, RLS, product tenancy sync, backfill.
-- Additive and idempotent. Does not drop/rename existing commerce tables.

-- ---------------------------------------------------------------------------
-- updated_at helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.set_businesses_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_updated_at ON public.businesses;
CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION private.set_businesses_updated_at();

CREATE OR REPLACE FUNCTION private.set_business_memberships_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_memberships_updated_at ON public.business_memberships;
CREATE TRIGGER business_memberships_updated_at
  BEFORE UPDATE ON public.business_memberships
  FOR EACH ROW EXECUTE FUNCTION private.set_business_memberships_updated_at();

-- ---------------------------------------------------------------------------
-- Store → Business auto-provision (BEFORE) + primary store attach (AFTER)
-- Functions defined in 20260804000001; ensure triggers exist on fresh applies.
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS stores_ensure_business ON public.stores;
CREATE TRIGGER stores_ensure_business
  BEFORE INSERT ON public.stores
  FOR EACH ROW EXECUTE FUNCTION private.ensure_business_for_store();

DROP TRIGGER IF EXISTS stores_attach_primary_business_store ON public.stores;
CREATE TRIGGER stores_attach_primary_business_store
  AFTER INSERT ON public.stores
  FOR EACH ROW EXECUTE FUNCTION private.attach_primary_store_to_business();

-- ---------------------------------------------------------------------------
-- Product master tenancy: copy business_id from parent store
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.ensure_product_business_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.business_id IS NULL AND NEW.store_id IS NOT NULL THEN
    SELECT s.business_id INTO NEW.business_id
    FROM public.stores s
    WHERE s.id = NEW.store_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_ensure_business ON public.products;
CREATE TRIGGER products_ensure_business
  BEFORE INSERT OR UPDATE OF store_id ON public.products
  FOR EACH ROW EXECUTE FUNCTION private.ensure_product_business_id();

-- ---------------------------------------------------------------------------
-- RLS (Auth.js era still uses service-role for writes; policies keep parity)
-- ---------------------------------------------------------------------------
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read own businesses" ON public.businesses;
CREATE POLICY "Members can read own businesses" ON public.businesses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_memberships m
      WHERE m.business_id = businesses.id
        AND m.user_id = auth.uid()
        AND m.status = 'active'::public.business_member_status
    )
    OR owner_user_id = auth.uid()
    OR private.current_user_role() = 'admin'::public.user_role
  );

DROP POLICY IF EXISTS "Users can insert own businesses" ON public.businesses;
CREATE POLICY "Users can insert own businesses" ON public.businesses
  FOR INSERT WITH CHECK (
    owner_user_id = auth.uid()
    OR private.current_user_role() = 'admin'::public.user_role
  );

DROP POLICY IF EXISTS "Owners can update own businesses" ON public.businesses;
CREATE POLICY "Owners can update own businesses" ON public.businesses
  FOR UPDATE USING (
    owner_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.business_memberships m
      WHERE m.business_id = businesses.id
        AND m.user_id = auth.uid()
        AND m.role = ANY (ARRAY['owner'::public.business_member_role, 'admin'::public.business_member_role])
        AND m.status = 'active'::public.business_member_status
    )
    OR private.current_user_role() = 'admin'::public.user_role
  );

DROP POLICY IF EXISTS "Members can read memberships" ON public.business_memberships;
CREATE POLICY "Members can read memberships" ON public.business_memberships
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.business_memberships m
      WHERE m.business_id = business_memberships.business_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'::public.business_member_status
    )
    OR private.current_user_role() = 'admin'::public.user_role
  );

DROP POLICY IF EXISTS "Owners can manage memberships" ON public.business_memberships;
CREATE POLICY "Owners can manage memberships" ON public.business_memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_memberships.business_id
        AND b.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.business_memberships m
      WHERE m.business_id = business_memberships.business_id
        AND m.user_id = auth.uid()
        AND m.role = ANY (ARRAY['owner'::public.business_member_role, 'admin'::public.business_member_role])
        AND m.status = 'active'::public.business_member_status
    )
    OR private.current_user_role() = 'admin'::public.user_role
  );

-- ---------------------------------------------------------------------------
-- Backfill: one Business per existing store owner; link stores + products
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  biz_id UUID;
  biz_slug TEXT;
BEGIN
  FOR r IN
    SELECT DISTINCT ON (s.owner_id)
      s.owner_id,
      s.id AS store_id,
      s.name,
      s.slug,
      s.business_type,
      s.logo_url,
      s.status
    FROM public.stores s
    WHERE s.business_id IS NULL
    ORDER BY s.owner_id, s.created_at ASC
  LOOP
    SELECT id INTO biz_id
    FROM public.businesses
    WHERE owner_user_id = r.owner_id AND deleted_at IS NULL
    ORDER BY created_at ASC
    LIMIT 1;

    IF biz_id IS NULL THEN
      biz_slug := r.slug || '-biz';
      IF EXISTS (SELECT 1 FROM public.businesses WHERE slug = biz_slug) THEN
        biz_slug := r.slug || '-biz-' || substr(r.store_id::text, 1, 8);
      END IF;

      INSERT INTO public.businesses (
        owner_user_id, legal_name, display_name, slug, status,
        business_type, logo_url, primary_store_id, metadata
      ) VALUES (
        r.owner_id, r.name, r.name, biz_slug,
        CASE WHEN r.status = 'active' THEN 'active'::public.business_status
             WHEN r.status = 'suspended' THEN 'suspended'::public.business_status
             ELSE 'pending'::public.business_status END,
        r.business_type, r.logo_url, r.store_id,
        jsonb_build_object('source', 'backfill_business_hub')
      )
      RETURNING id INTO biz_id;

      INSERT INTO public.business_memberships (business_id, user_id, role, status)
      VALUES (biz_id, r.owner_id, 'owner', 'active')
      ON CONFLICT (business_id, user_id) DO NOTHING;
    END IF;

    UPDATE public.stores
    SET business_id = biz_id
    WHERE owner_id = r.owner_id AND business_id IS NULL;
  END LOOP;

  UPDATE public.products p
  SET business_id = s.business_id
  FROM public.stores s
  WHERE p.store_id = s.id
    AND p.business_id IS NULL
    AND s.business_id IS NOT NULL;
END $$;
