-- Nexar Network: Products, Carts (Phase 2)

-- ─── Products ────────────────────────────────────────────────────────────────
CREATE TABLE public.products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(20,8) NOT NULL CHECK (price >= 0),
  currency      TEXT NOT NULL DEFAULT 'USD',
  image_url     TEXT,
  stock         INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  search_vector TSVECTOR,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_store ON public.products(store_id);
CREATE INDEX idx_products_active ON public.products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_search ON public.products USING gin(search_vector);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE OR REPLACE FUNCTION private.update_product_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_search_vector
  BEFORE INSERT OR UPDATE OF name, description ON public.products
  FOR EACH ROW EXECUTE FUNCTION private.update_product_search_vector();

-- ─── Carts ───────────────────────────────────────────────────────────────────
CREATE TABLE public.carts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id)
);

CREATE TRIGGER carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ─── Cart Items ──────────────────────────────────────────────────────────────
CREATE TABLE public.cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id    UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart ON public.cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON public.cart_items(product_id);

CREATE TRIGGER cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ─── RLS: Products ─────────────────────────────────────────────────────────
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Public marketplace: active products from active marketplace stores
CREATE POLICY "Anyone can read marketplace products"
  ON public.products FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = products.store_id
        AND stores.status = 'active'
        AND stores.mode = 'marketplace'
    )
  );

CREATE POLICY "Merchants can read own store products"
  ON public.products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = products.store_id
        AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can insert own store products"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_id
        AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can update own store products"
  ON public.products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = products.store_id
        AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can delete own store products"
  ON public.products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = products.store_id
        AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all products"
  ON public.products FOR ALL
  USING (private.current_user_role() = 'admin');

-- ─── RLS: Carts ──────────────────────────────────────────────────────────────
CREATE POLICY "Customers can read own cart"
  ON public.carts FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can insert own cart"
  ON public.carts FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update own cart"
  ON public.carts FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can delete own cart"
  ON public.carts FOR DELETE
  USING (auth.uid() = customer_id);

-- ─── RLS: Cart Items ─────────────────────────────────────────────────────────
CREATE POLICY "Customers can read own cart items"
  ON public.cart_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND carts.customer_id = auth.uid()
    )
  );

CREATE POLICY "Customers can insert own cart items"
  ON public.cart_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND carts.customer_id = auth.uid()
    )
  );

CREATE POLICY "Customers can update own cart items"
  ON public.cart_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND carts.customer_id = auth.uid()
    )
  );

CREATE POLICY "Customers can delete own cart items"
  ON public.cart_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
        AND carts.customer_id = auth.uid()
    )
  );

-- ─── Storage: product images ─────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Merchants can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "Merchants can update own product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Merchants can delete own product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
