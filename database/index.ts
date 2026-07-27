export { createClient as createBrowserClient } from "@/lib/supabase/client";
export { createClient as createServerClient } from "@/lib/supabase/server";
export { createAdminClient } from "@/lib/supabase/admin";

/**
 * Database schema is defined in supabase/migrations/.
 * See docs/database.md for full architecture reference.
 * Run scripts/validate-database.sql after applying migrations.
 */
export const DATABASE_MIGRATION_COUNT = 17;
