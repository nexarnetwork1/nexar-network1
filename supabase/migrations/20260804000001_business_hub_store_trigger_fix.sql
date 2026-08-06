-- Fix Business Hub store trigger: defer primary_store_id until AFTER INSERT.

CREATE OR REPLACE FUNCTION private.ensure_business_for_store()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  biz_id UUID;
  biz_slug TEXT;
BEGIN
  IF NEW.business_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO biz_id
  FROM public.businesses
  WHERE owner_user_id = NEW.owner_id AND deleted_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF biz_id IS NULL THEN
    biz_slug := NEW.slug || '-biz';
    INSERT INTO public.businesses (
      owner_user_id, legal_name, display_name, slug, status,
      business_type, logo_url, primary_store_id, metadata
    ) VALUES (
      NEW.owner_id, NEW.name, NEW.name, biz_slug,
      CASE WHEN NEW.status = 'active' THEN 'active'::public.business_status
           WHEN NEW.status = 'suspended' THEN 'suspended'::public.business_status
           ELSE 'pending'::public.business_status END,
      NEW.business_type, NEW.logo_url, NULL,
      jsonb_build_object('source', 'store_insert_trigger')
    )
    RETURNING id INTO biz_id;

    INSERT INTO public.business_memberships (business_id, user_id, role, status)
    VALUES (biz_id, NEW.owner_id, 'owner', 'active')
    ON CONFLICT (business_id, user_id) DO NOTHING;
  END IF;

  NEW.business_id := biz_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.attach_primary_store_to_business()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.business_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.businesses
  SET primary_store_id = COALESCE(primary_store_id, NEW.id),
      updated_at = NOW()
  WHERE id = NEW.business_id
    AND deleted_at IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stores_attach_primary_business_store ON public.stores;
CREATE TRIGGER stores_attach_primary_business_store
  AFTER INSERT ON public.stores
  FOR EACH ROW EXECUTE FUNCTION private.attach_primary_store_to_business();
