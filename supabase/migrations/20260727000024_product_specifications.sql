-- Product specifications for marketplace detail pages

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS specifications JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.products.specifications IS
  'Key-value product specifications displayed on product detail pages';
