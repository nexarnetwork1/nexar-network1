import { NextResponse } from "next/server";
import { runHealthChecks } from "@/lib/monitoring/health";

export async function GET() {
  const result = await runHealthChecks();
  const statusCode =
    result.status === "healthy" ? 200 : result.status === "degraded" ? 200 : 503;

  return NextResponse.json(result, { status: statusCode });
}
