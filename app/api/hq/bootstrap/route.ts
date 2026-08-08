import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/config/env";
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

function assertBootstrapToken(request: Request): boolean {
  const configured = env.BOOTSTRAP_TOKEN;
  if (!configured) return true;
  const provided =
    request.headers.get("x-bootstrap-token") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return provided === configured;
}

/** First-install only. Rejects once bootstrap is complete. */
export async function POST(request: Request) {
  if (!assertSameOrigin(request, { strict: true })) {
    return crossOriginForbiddenResponse();
  }

  if (!assertBootstrapToken(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    const message = err instanceof Error ? err.message : "Bootstrap failed";
    const status = message.includes("already") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET() {
  const state = await getBootstrapState().catch(() => null);
  return NextResponse.json({
    completed: Boolean(state?.completed),
  });
}
