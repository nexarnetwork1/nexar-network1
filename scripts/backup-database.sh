#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is required (postgres connection string)."
  exit 1
fi

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
mkdir -p "$BACKUP_DIR"

OUTPUT="$BACKUP_DIR/nexar-db-$TIMESTAMP.sql.gz"
echo "Creating database backup at $OUTPUT"
pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges | gzip > "$OUTPUT"

find "$BACKUP_DIR" -name 'nexar-db-*.sql.gz' -mtime +14 -delete
echo "Backup complete. Retention: 14 days."
