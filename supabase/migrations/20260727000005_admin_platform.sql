-- Fix exchange_rates upsert constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_exchange_rates_pair_unique
  ON public.exchange_rates(base_currency, quote_currency);
