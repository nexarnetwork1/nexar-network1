import { beforeEach, vi } from "vitest";
import { resetBruteForceStore } from "@/lib/security/brute-force";

vi.stubEnv("NODE_ENV", "test");
vi.stubEnv("SKIP_ENV_VALIDATION", "true");
vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

beforeEach(() => {
  resetBruteForceStore();
});
