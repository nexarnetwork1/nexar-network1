-- Realtime wallet updates + expanded global search (payments, customers)

ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settlements;

CREATE OR REPLACE FUNCTION public.global_search(
  p_query TEXT,
  p_limit INTEGER DEFAULT 20
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE
  v_q TEXT := trim(p_query);
  v_role public.user_role;
BEGIN
  IF length(v_q) < 2 THEN
    RETURN jsonb_build_object('results', '[]'::JSONB);
  END IF;

  v_role := private.current_user_role();

  IF v_role = 'admin' THEN
    RETURN jsonb_build_object('results', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 'product' AS type, id::TEXT AS id, name AS title, store_id::TEXT AS ref
        FROM public.products WHERE name ILIKE '%' || v_q || '%' LIMIT p_limit
        UNION ALL
        SELECT 'order', id::TEXT, 'Order ' || LEFT(id::TEXT, 8), store_id::TEXT
        FROM public.orders WHERE id::TEXT ILIKE '%' || v_q || '%' LIMIT p_limit
        UNION ALL
        SELECT 'invoice', id::TEXT, invoice_number, store_id::TEXT
        FROM public.invoices WHERE invoice_number ILIKE '%' || v_q || '%' LIMIT p_limit
        UNION ALL
        SELECT 'payment', ps.id::TEXT, 'Payment ' || LEFT(ps.id::TEXT, 8), ps.order_id::TEXT
        FROM public.payment_sessions ps
        WHERE ps.id::TEXT ILIKE '%' || v_q || '%' OR ps.deposit_address ILIKE '%' || v_q || '%'
        LIMIT p_limit
        UNION ALL
        SELECT 'customer', p.id::TEXT, COALESCE(p.full_name, p.email), p.id::TEXT
        FROM public.profiles p
        WHERE p.role = 'customer' AND (p.email ILIKE '%' || v_q || '%' OR p.full_name ILIKE '%' || v_q || '%')
        LIMIT p_limit
        UNION ALL
        SELECT 'merchant', p.id::TEXT, COALESCE(mp.business_name, p.full_name, p.email), p.id::TEXT
        FROM public.profiles p
        LEFT JOIN public.merchant_profiles mp ON mp.profile_id = p.id
        WHERE p.role = 'merchant' AND (p.email ILIKE '%' || v_q || '%' OR mp.business_name ILIKE '%' || v_q || '%')
        LIMIT p_limit
      ) t
    ), '[]'::JSONB));
  ELSIF v_role = 'merchant' THEN
    RETURN jsonb_build_object('results', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 'product' AS type, pr.id::TEXT AS id, pr.name AS title, pr.store_id::TEXT AS ref
        FROM public.products pr
        JOIN public.stores s ON s.id = pr.store_id AND s.owner_id = auth.uid()
        WHERE pr.name ILIKE '%' || v_q || '%' LIMIT p_limit
        UNION ALL
        SELECT 'order', o.id::TEXT, 'Order ' || LEFT(o.id::TEXT, 8), o.store_id::TEXT
        FROM public.orders o
        JOIN public.stores s ON s.id = o.store_id AND s.owner_id = auth.uid()
        WHERE o.id::TEXT ILIKE '%' || v_q || '%' LIMIT p_limit
        UNION ALL
        SELECT 'invoice', i.id::TEXT, i.invoice_number, i.store_id::TEXT
        FROM public.invoices i
        JOIN public.stores s ON s.id = i.store_id AND s.owner_id = auth.uid()
        WHERE i.invoice_number ILIKE '%' || v_q || '%' LIMIT p_limit
        UNION ALL
        SELECT 'payment', ps.id::TEXT, 'Payment ' || LEFT(ps.id::TEXT, 8), ps.order_id::TEXT
        FROM public.payment_sessions ps
        JOIN public.orders o ON o.id = ps.order_id
        JOIN public.stores s ON s.id = o.store_id AND s.owner_id = auth.uid()
        WHERE ps.id::TEXT ILIKE '%' || v_q || '%' LIMIT p_limit
      ) t
    ), '[]'::JSONB));
  ELSE
    RETURN jsonb_build_object('results', COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 'product' AS type, id::TEXT AS id, name AS title, store_id::TEXT AS ref
        FROM public.products WHERE is_active AND name ILIKE '%' || v_q || '%' LIMIT p_limit
      ) t
    ), '[]'::JSONB));
  END IF;
END;
$$;
