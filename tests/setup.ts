import { beforeEach, vi } from "vitest";

vi.hoisted(() => {
  vi.stubEnv("NODE_ENV", "test");
  process.env.SKIP_ENV_VALIDATION = "true";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
});

import { resetBruteForceStore } from "@/lib/security/brute-force";

beforeEach(() => {
  resetBruteForceStore();
});
