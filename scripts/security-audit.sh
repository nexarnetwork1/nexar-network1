#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== Nexar Security Audit =="

echo "[1/5] npm audit"
npm audit --audit-level=high || true

echo "[2/5] Type check"
npm run typecheck

echo "[3/5] Lint"
npm run lint

echo "[4/5] Tests"
npm run test:ci

echo "[5/5] Secret scan (basic)"
if rg -n "(TREASURY_WALLET_PRIVATE_KEY|PAYMENT_MASTER_SEED|SUPABASE_SERVICE_ROLE_KEY)\s*=\s*['\"][^'\"]+['\"]" \
  --glob '!*.md' --glob '!*.example' --glob '!.env*' .; then
  echo "Potential hardcoded secrets found."
  exit 1
fi

echo "Security audit completed."
