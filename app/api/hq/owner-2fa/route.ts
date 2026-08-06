import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  assertSameOrigin,
  crossOriginForbiddenResponse,
} from "@/lib/security/origin-check";
import { completePlatformOwner2fa } from "@/modules/atlas-hq/service";

const schema = z.object({
  userId: z.string().uuid(),
  confirmed: z.literal(true),
});

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return crossOriginForbiddenResponse();

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (parsed.data.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await completePlatformOwner2fa(parsed.data.userId);
  return NextResponse.json({ success: true });
}
