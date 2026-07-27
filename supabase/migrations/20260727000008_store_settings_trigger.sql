-- Auto-create store_settings row when a store is registered

CREATE OR REPLACE FUNCTION private.ensure_store_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.store_settings (store_id)
  VALUES (NEW.id)
  ON CONFLICT (store_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stores_ensure_settings ON public.stores;
CREATE TRIGGER stores_ensure_settings
  AFTER INSERT ON public.stores
  FOR EACH ROW EXECUTE FUNCTION private.ensure_store_settings();

-- Backfill any stores missing settings
INSERT INTO public.store_settings (store_id)
SELECT s.id FROM public.stores s
WHERE NOT EXISTS (
  SELECT 1 FROM public.store_settings ss WHERE ss.store_id = s.id
);
