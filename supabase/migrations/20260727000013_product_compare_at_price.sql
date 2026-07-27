-- Optional compare-at (list) price for sale display; checkout uses `price`

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(20,8)
  CHECK (compare_at_price IS NULL OR compare_at_price >= 0);

ALTER TABLE public.products
  ADD CONSTRAINT products_compare_at_above_price
  CHECK (compare_at_price IS NULL OR compare_at_price > price);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN GENERATED ALWAYS AS (
    compare_at_price IS NOT NULL AND compare_at_price > price
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_on_sale
  ON public.products (is_on_sale)
  WHERE is_on_sale = TRUE;
