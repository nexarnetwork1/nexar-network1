import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/modules/users/repository";
import { approveBrand } from "@/modules/marketplace/brands";
import { assertSameOrigin, crossOriginForbiddenResponse } from "@/lib/security/origin-check";

type Props = { params: Promise<{ brandId: string }> };

export async function POST(request: Request, { params }: Props) {
  if (!assertSameOrigin(request, { strict: true })) return crossOriginForbiddenResponse();

  try {
    await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { brandId } = await params;
  const result = await approveBrand(brandId);

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Approval failed" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
