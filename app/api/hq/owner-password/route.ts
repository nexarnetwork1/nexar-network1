import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  assertSameOrigin,
  crossOriginForbiddenResponse,
} from "@/lib/security/origin-check";
import { completePlatformOwnerPasswordChange } from "@/modules/atlas-hq/service";

const schema = z.object({
  userId: z.string().uuid(),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12).max(128),
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

  const result = await completePlatformOwnerPasswordChange(parsed.data);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
