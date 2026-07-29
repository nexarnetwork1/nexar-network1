#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTAINER="${MIG_TEST_CONTAINER:-nexar-mig-test}"

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" -e POSTGRES_PASSWORD=postgres postgres:15-alpine >/dev/null

until docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; do sleep 2; done

docker exec -i "$CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 <<'SQL'
CREATE SCHEMA IF NOT EXISTS private;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY, email text);
CREATE TABLE IF NOT EXISTS storage.buckets (id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
CREATE TABLE IF NOT EXISTS storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT '{}'::jsonb $$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT 'anon'::text $$;
CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT ARRAY['']::text[] $$;
DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role NOLOGIN BYPASSRLS; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE PUBLICATION supabase_realtime; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
SQL

echo "Applying migrations (first pass)..."
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "  $(basename "$f")"
  if ! docker exec -i "$CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 -f - < "$f" >/tmp/mig-last.txt 2>&1; then
    echo "FAILED: $(basename "$f")"
    tail -40 /tmp/mig-last.txt
    exit 1
  fi
done

echo "Re-applying migration 07 (idempotency check)..."
docker exec -i "$CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 -f - < "$ROOT/supabase/migrations/20260727000007_database_architecture.sql" >/tmp/mig-07-rerun.txt 2>&1 || {
  echo "FAILED: migration 07 re-run"
  tail -40 /tmp/mig-07-rerun.txt
  exit 1
}

echo "ALL MIGRATIONS OK"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
