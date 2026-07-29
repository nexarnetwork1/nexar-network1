import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "nexar-commerce",
    version: "v1",
    modules: [
      "catalog",
      "cart",
      "checkout",
      "statistics",
      "analytics",
      "brands",
      "discovery",
      "realtime",
    ],
  });
}
