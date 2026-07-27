-- Dev-only seed helpers. Do NOT run in production.
-- Requires auth.users created via Supabase Auth dashboard or CLI first.

-- 1) Promote a user to admin after signup:
-- UPDATE public.profiles
-- SET role = 'admin', profile_completed = true
-- WHERE email = 'admin@nexarnetwork.org';

-- 2) Set treasury wallet (never hardcode in application code):
-- UPDATE public.platform_settings
-- SET treasury_wallet_address = '0xYourTreasuryAddress';

-- 3) Verify reference data seeded by migrations:
-- SELECT code, kind FROM public.supported_currencies ORDER BY sort_order;
-- SELECT code, name FROM public.payment_methods ORDER BY code;
-- SELECT payment_type, base_rate FROM public.fee_schedules;

-- 4) After creating a merchant + active store, confirm auto-seeded rows:
-- SELECT * FROM public.store_settings WHERE store_id = '<store-uuid>';
-- SELECT qr_type, is_active FROM public.qr_codes WHERE store_id = '<store-uuid>';
-- SELECT * FROM public.merchant_promotions WHERE store_id = '<store-uuid>';

-- 5) Smoke-test atomic payment RPC (service role only):
-- SELECT public.complete_payment('<session-uuid>', '<tx-hash>', 1.0);

-- 6) Validate schema after migrations:
-- SELECT * FROM public.validate_database_schema() ORDER BY check_name;
-- Or run scripts/validate-database.sql in Supabase SQL Editor.
