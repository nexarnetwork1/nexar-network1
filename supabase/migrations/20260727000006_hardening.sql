-- Phase 6: Merchant settlement read access (idempotent)
DROP POLICY IF EXISTS "Merchants can read store settlements" ON public.settlements;
CREATE POLICY "Merchants can read store settlements"
  ON public.settlements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.stores s ON s.id = o.store_id
      WHERE o.id = settlements.order_id AND s.owner_id = auth.uid()
    )
  );
