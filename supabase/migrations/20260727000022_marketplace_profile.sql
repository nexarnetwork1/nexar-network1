-- Marketplace UX profile fields on store_settings (extends existing table)

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS marketplace_profile JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.store_settings.marketplace_profile IS
  'Storefront customization: banner, colors, description, social, hours, featured flag';

-- Public read for active marketplace store profiles (storefront pages)
DROP POLICY IF EXISTS store_settings_marketplace_public_read ON public.store_settings;
CREATE POLICY store_settings_marketplace_public_read
  ON public.store_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_settings.store_id
        AND s.status = 'active'
        AND s.mode = 'marketplace'
    )
  );
