import { createClient } from "@supabase/supabase-js";
import { getEnvOptional } from "@/lib/config/env";

const env = getEnvOptional();

export const supabase = createClient(
  env.supabaseUrl || '',
  env.supabasePublishableKey || ''
);

export const supabaseAdmin = createClient(
  env.supabaseUrl || '',
  env.supabaseServiceRoleKey || env.supabasePublishableKey || ''
);
