import { NextResponse } from "next/server";
import { searchRepository } from "@/modules/marketplace/discovery";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const suggestions = await searchRepository.suggest(q);
  return NextResponse.json({ suggestions });
}
