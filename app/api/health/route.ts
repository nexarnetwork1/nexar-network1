import { NextResponse } from "next/server";
import { runHealthChecks } from "@/lib/monitoring/health";
import { pingBetterStackHeartbeat } from "@/lib/monitoring/betterstack";

export async function GET() {
  const result = await runHealthChecks();
  const statusCode =
    result.status === "healthy" ? 200 : result.status === "degraded" ? 200 : 503;

  if (result.status !== "unhealthy") {
    void pingBetterStackHeartbeat();
  }

  return NextResponse.json(result, { status: statusCode });
}
