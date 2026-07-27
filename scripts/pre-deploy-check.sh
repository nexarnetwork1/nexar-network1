#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

required=(
  NEXT_PUBLIC_APP_URL
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  CRON_SECRET
)

if [[ "${NODE_ENV:-}" == "production" ]]; then
  required+=(
    STRIPE_SECRET_KEY
    STRIPE_WEBHOOK_SECRET
    PAYMENT_MASTER_SEED
    TREASURY_WALLET_PRIVATE_KEY
    SENTRY_DSN
  )
fi

missing=0
for key in "${required[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "Missing required env: $key"
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  exit 1
fi

echo "Environment validation passed."
npm run prelaunch
