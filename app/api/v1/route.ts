import { NextResponse } from "next/server";
import { publicApiConfig } from "@/config/public-api";

export async function GET() {
  return NextResponse.json({
    name: "Nexar Network API",
    version: publicApiConfig.version,
    documentation: "/docs/platform-extensions.md",
    status: "preview",
    endpoints: {
      health: "/api/health",
      search: "/api/search",
    },
    note: "Full REST API with API key authentication is prepared for future developer portal activation.",
  });
}
