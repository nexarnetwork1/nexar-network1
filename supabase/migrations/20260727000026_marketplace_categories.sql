-- Platform-level marketplace categories (Electronics, Fashion, etc.)

CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  icon        TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_categories_sort
  ON public.marketplace_categories (sort_order ASC, name ASC);

DROP TRIGGER IF EXISTS marketplace_categories_updated_at ON public.marketplace_categories;
CREATE TRIGGER marketplace_categories_updated_at
  BEFORE UPDATE ON public.marketplace_categories
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS marketplace_category_id UUID
  REFERENCES public.marketplace_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_marketplace_category
  ON public.products(marketplace_category_id)
  WHERE marketplace_category_id IS NOT NULL;

INSERT INTO public.marketplace_categories (name, slug, sort_order) VALUES
  ('Electronics', 'electronics', 1),
  ('Fashion', 'fashion', 2),
  ('Digital Products', 'digital-products', 3),
  ('Software', 'software', 4),
  ('Gaming', 'gaming', 5),
  ('Services', 'services', 6),
  ('Crypto', 'crypto', 7),
  ('Home', 'home', 8),
  ('Books', 'books', 9),
  ('Other', 'other', 10)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketplace_categories_public_read ON public.marketplace_categories;
CREATE POLICY marketplace_categories_public_read
  ON public.marketplace_categories FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS marketplace_categories_admin_manage ON public.marketplace_categories;
CREATE POLICY marketplace_categories_admin_manage
  ON public.marketplace_categories FOR ALL
  USING (private.current_user_role() = 'admin')
  WITH CHECK (private.current_user_role() = 'admin');
