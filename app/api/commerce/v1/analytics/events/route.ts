import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/modules/users/repository";
import { trackAnalyticsEvent } from "@/modules/marketplace/analytics";
import { analyticsEventSchema } from "@/modules/marketplace/statistics/validators";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = analyticsEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const profile = await getCurrentProfile();

  try {
    await trackAnalyticsEvent(profile?.id ?? null, parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to track event" },
      { status: 500 }
    );
  }
}
