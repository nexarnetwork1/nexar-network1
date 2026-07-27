-- Nexar Network: Orders & Invoices (Phase 3)

-- ─── Invoice number sequence ─────────────────────────────────────────────────
CREATE TABLE public.invoice_sequences (
  year       INT PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION private.next_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INT := EXTRACT(YEAR FROM NOW())::INT;
  v_num  INT;
BEGIN
  INSERT INTO public.invoice_sequences (year, last_number)
  VALUES (v_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET last_number = invoice_sequences.last_number + 1
  RETURNING last_number INTO v_num;

  RETURN 'INV-' || v_year::TEXT || '-' || lpad(v_num::TEXT, 6, '0');
END;
$$;

-- ─── Orders ──────────────────────────────────────────────────────────────────
CREATE TABLE public.orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  store_id         UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  status           public.order_status NOT NULL DEFAULT 'pending_payment',
  subtotal         NUMERIC(20,8) NOT NULL CHECK (subtotal >= 0),
  platform_fee     NUMERIC(20,8) NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
  merchant_amount  NUMERIC(20,8) NOT NULL DEFAULT 0 CHECK (merchant_amount >= 0),
  currency         TEXT NOT NULL DEFAULT 'USD',
  payment_method   public.payment_method,
  merchant_wallet_snapshot TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at          TIMESTAMPTZ
);

CREATE INDEX idx_orders_customer ON public.orders(customer_id, created_at DESC);
CREATE INDEX idx_orders_store ON public.orders(store_id, status, created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ─── Order Items ─────────────────────────────────────────────────────────────
CREATE TABLE public.order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(20,8) NOT NULL CHECK (unit_price >= 0),
  line_total  NUMERIC(20,8) NOT NULL CHECK (line_total >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- ─── Invoices ────────────────────────────────────────────────────────────────
CREATE TABLE public.invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT NOT NULL UNIQUE,
  order_id        UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  amount          NUMERIC(20,8) NOT NULL CHECK (amount >= 0),
  currency        TEXT NOT NULL DEFAULT 'USD',
  status          public.invoice_status NOT NULL DEFAULT 'pending',
  pdf_path        TEXT,
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at          TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  paid_at         TIMESTAMPTZ
);

CREATE INDEX idx_invoices_customer ON public.invoices(customer_id, issued_at DESC);
CREATE INDEX idx_invoices_store ON public.invoices(store_id, issued_at DESC);
CREATE INDEX idx_invoices_number ON public.invoices(invoice_number);

-- ─── Atomic checkout per store ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_store_checkout(
  p_store_id UUID,
  p_cart_id  UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id   UUID := auth.uid();
  v_order_id      UUID;
  v_invoice_id    UUID;
  v_invoice_num   TEXT;
  v_subtotal      NUMERIC(20,8) := 0;
  v_store_wallet  TEXT;
  v_cart_item     RECORD;
  v_product       RECORD;
BEGIN
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.carts
    WHERE id = p_cart_id AND customer_id = v_customer_id
  ) THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

  SELECT wallet_address INTO v_store_wallet
  FROM public.stores
  WHERE id = p_store_id AND status = 'active';

  IF v_store_wallet IS NULL THEN
    RAISE EXCEPTION 'Store not available';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.cart_items ci
    JOIN public.products p ON p.id = ci.product_id
    WHERE ci.cart_id = p_cart_id AND p.store_id = p_store_id
  ) THEN
    RAISE EXCEPTION 'No items for this store in cart';
  END IF;

  FOR v_cart_item IN
    SELECT ci.id AS cart_item_id, ci.quantity, ci.product_id
    FROM public.cart_items ci
    JOIN public.products p ON p.id = ci.product_id
    WHERE ci.cart_id = p_cart_id AND p.store_id = p_store_id
  LOOP
    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_cart_item.product_id AND is_active = TRUE
    FOR UPDATE;

    IF v_product IS NULL THEN
      RAISE EXCEPTION 'Product unavailable: %', v_cart_item.product_id;
    END IF;

    IF v_product.stock < v_cart_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product: %', v_product.name;
    END IF;

    v_subtotal := v_subtotal + (v_product.price * v_cart_item.quantity);
  END LOOP;

  INSERT INTO public.orders (
    customer_id, store_id, status, subtotal, currency, merchant_wallet_snapshot
  ) VALUES (
    v_customer_id, p_store_id, 'pending_payment', v_subtotal, 'USD', v_store_wallet
  ) RETURNING id INTO v_order_id;

  FOR v_cart_item IN
    SELECT ci.id AS cart_item_id, ci.quantity, ci.product_id
    FROM public.cart_items ci
    JOIN public.products p ON p.id = ci.product_id
    WHERE ci.cart_id = p_cart_id AND p.store_id = p_store_id
  LOOP
    SELECT * INTO v_product FROM public.products WHERE id = v_cart_item.product_id;

    INSERT INTO public.order_items (
      order_id, product_id, product_name, quantity, unit_price, line_total
    ) VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_cart_item.quantity,
      v_product.price,
      v_product.price * v_cart_item.quantity
    );

    UPDATE public.products
    SET stock = stock - v_cart_item.quantity
    WHERE id = v_product.id;

    DELETE FROM public.cart_items WHERE id = v_cart_item.cart_item_id;
  END LOOP;

  v_invoice_num := private.next_invoice_number();

  INSERT INTO public.invoices (
    invoice_number, order_id, customer_id, store_id, amount, currency, status
  ) VALUES (
    v_invoice_num, v_order_id, v_customer_id, p_store_id, v_subtotal, 'USD', 'pending'
  ) RETURNING id INTO v_invoice_id;

  PERFORM private.write_audit_log(
    v_customer_id,
    (SELECT role FROM public.profiles WHERE id = v_customer_id),
    'checkout.created',
    'order',
    v_order_id,
    jsonb_build_object(
      'invoice_id', v_invoice_id,
      'invoice_number', v_invoice_num,
      'store_id', p_store_id,
      'subtotal', v_subtotal
    )
  );

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_num
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_store_checkout(UUID, UUID) TO authenticated;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can read own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Merchants can read store orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage orders"
  ON public.orders FOR ALL
  USING (private.current_user_role() = 'admin');

CREATE POLICY "Customers can read own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can read store order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.stores s ON s.id = o.store_id
      WHERE o.id = order_items.order_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage order items"
  ON public.order_items FOR ALL
  USING (private.current_user_role() = 'admin');

CREATE POLICY "Customers can read own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Merchants can read store invoices"
  ON public.invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = invoices.store_id AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage invoices"
  ON public.invoices FOR ALL
  USING (private.current_user_role() = 'admin');

CREATE POLICY "Admins can read invoice sequences"
  ON public.invoice_sequences FOR SELECT
  USING (private.current_user_role() = 'admin');

-- ─── Private invoice storage ─────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Customers can read own invoice PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoices'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Merchants can read store invoice PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoices'
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.stores s ON s.id = i.store_id
      WHERE s.owner_id = auth.uid()
        AND i.pdf_path = name
    )
  );

CREATE POLICY "Admins can read all invoice PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoices'
    AND private.current_user_role() = 'admin'
  );

CREATE POLICY "Service can upload invoice PDFs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'invoices');
