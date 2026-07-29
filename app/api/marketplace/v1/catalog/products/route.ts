import { NextResponse } from "next/server";
import { listCatalogProducts } from "@/modules/marketplace/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "24");
  const query = searchParams.get("q") ?? undefined;

  const result = await listCatalogProducts({ page, limit, query });

  return NextResponse.json({
    data: result.items,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
    },
  });
}
