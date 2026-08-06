import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertSameOrigin,
  crossOriginForbiddenResponse,
} from "@/lib/security/origin-check";
import { getBootstrapState } from "@/modules/atlas-hq/repository";
import { runPlatformOwnerWizard } from "@/modules/atlas-hq/bootstrap";

const bodySchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(12).max(128),
  fullName: z.string().min(2).max(120).optional(),
});

/** First-install only. Rejects once bootstrap is complete. */
export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return crossOriginForbiddenResponse();

  const state = await getBootstrapState().catch(() => null);
  if (state?.completed) {
    return NextResponse.json(
      { error: "Platform already bootstrapped", alreadyComplete: true },
      { status: 409 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const result = await runPlatformOwnerWizard(parsed.data);
    return NextResponse.json({
      success: true,
      bootstrapped: result.bootstrapped,
      alreadyComplete: result.alreadyComplete,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bootstrap failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const state = await getBootstrapState().catch(() => null);
  return NextResponse.json({
    completed: Boolean(state?.completed),
  });
}
