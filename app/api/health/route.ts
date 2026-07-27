import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {
    app: "ok",
    supabase: "error",
  };

  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const admin = createAdminClient();
      const { error } = await admin.from("platform_settings").select("id").limit(1);
      checks.supabase = error ? "error" : "ok";
    } else {
      checks.supabase = "ok";
    }
  } catch {
    checks.supabase = "error";
  }

  const healthy = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
