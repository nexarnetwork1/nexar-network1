import { NextResponse } from "next/server";
import { suggestMarketplaceSearch } from "@/modules/marketplace/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Number(searchParams.get("limit") ?? 8);

  const result = await suggestMarketplaceSearch(
    q,
    Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 12) : 8
  );

  return NextResponse.json(result);
}
