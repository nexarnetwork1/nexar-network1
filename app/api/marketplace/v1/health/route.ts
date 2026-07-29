import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "marketplace",
    version: "v1",
    status: "foundation",
  });
}
