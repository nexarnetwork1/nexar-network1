-- Normalize legacy nexar:// QR payloads — display layer resolves full URL from secret_token

UPDATE public.qr_codes
SET payload = secret_token
WHERE payload LIKE 'nexar://%';
