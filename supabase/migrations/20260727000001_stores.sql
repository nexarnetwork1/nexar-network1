-- Nexar Network: Stores + Storage for merchant registration (Phase 1)

-- ─── Stores ────────────────────────────────────────────────────────────────
CREATE TABLE public.stores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  business_type   TEXT,
  logo_url        TEXT,
  mode            public.store_mode NOT NULL DEFAULT 'marketplace',
  status          public.store_status NOT NULL DEFAULT 'pending',
  wallet_address  TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stores_owner ON public.stores(owner_id);
CREATE INDEX idx_stores_slug ON public.stores(slug);
CREATE INDEX idx_stores_status ON public.stores(status);

CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ─── Merchant promotions (auto-created on store activation) ──────────────────
CREATE TABLE public.merchant_promotions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  promotion_type   TEXT NOT NULL DEFAULT 'new_merchant_discount',
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 50,
  starts_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '3 months'),
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_merchant_promotions_store ON public.merchant_promotions(store_id);
CREATE INDEX idx_merchant_promotions_active ON public.merchant_promotions(is_active, expires_at);

-- Auto-create promotion when store becomes active
CREATE OR REPLACE FUNCTION private.create_merchant_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    INSERT INTO public.merchant_promotions (store_id)
    VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_store_activated
  AFTER INSERT OR UPDATE OF status ON public.stores
  FOR EACH ROW EXECUTE FUNCTION private.create_merchant_promotion();

-- ─── Slug helper ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION private.generate_store_slug(p_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  base_slug := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM public.stores WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;

-- ─── RLS: Stores ─────────────────────────────────────────────────────────────
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active stores"
  ON public.stores FOR SELECT
  USING (status = 'active');

CREATE POLICY "Owners can read own stores"
  ON public.stores FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can update own stores"
  ON public.stores FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Merchants can insert own stores"
  ON public.stores FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all stores"
  ON public.stores FOR ALL
  USING (private.current_user_role() = 'admin');

CREATE POLICY "Store owners can read own promotions"
  ON public.merchant_promotions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = merchant_promotions.store_id
        AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage promotions"
  ON public.merchant_promotions FOR ALL
  USING (private.current_user_role() = 'admin');

-- ─── Storage: store logos ──────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-logos',
  'store-logos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload store logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'store-logos');

CREATE POLICY "Anyone can view store logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'store-logos');

CREATE POLICY "Owners can update own store logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'store-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can delete own store logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'store-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
