"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAssistantRateLimit } from "@/lib/ai/rate-limit";
import { requirePermission } from "@/lib/auth/permissions";
import { AuthorizationError } from "@/lib/auth/guards";
import { getMembership } from "@/modules/business-hub/repository";
import type { Profile } from "@/types";
import { getBusinessAiWorkspace, runCapability } from "./service";
import { generateAssistCompletion } from "./llm";
import {
  buildAssistPrompt,
  SURFACE_ACTIONS,
  type AiAssistAction,
  type AiAssistSurface,
} from "./prompts-contextual";

const contextualAssistSchema = z.object({
  surface: z.enum(["post", "comment", "message", "company", "marketplace", "job", "search"]),
  action: z.string().min(1).max(80),
  text: z.string().max(20000).optional(),
  context: z.record(z.unknown()).optional(),
  businessId: z.string().uuid().optional(),
  targetLocale: z.string().max(40).optional(),
});

const SENSITIVE_SURFACES = new Set<AiAssistSurface>(["company", "marketplace", "job"]);

export async function contextualAssistAction(input: {
  surface: AiAssistSurface;
  action: AiAssistAction;
  text?: string;
  context?: Record<string, unknown>;
  businessId?: string;
  targetLocale?: string;
}): Promise<{ success: boolean; content?: string; mode?: "openai" | "demo"; error?: string }> {
  const parsed = contextualAssistSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Sign in to use ATLAS AI" };
  }

  const admin = createAdminClient();
  const { data: profileRow } = await admin
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();
  if (!profileRow) {
    return { success: false, error: "Profile not found" };
  }
  const profile = profileRow as Profile;

  try {
    await requirePermission(profile, "ai:use", parsed.data.businessId);
  } catch (err) {
    return {
      success: false,
      error: err instanceof AuthorizationError ? err.message : "Not authorized to use AI",
    };
  }

  if (parsed.data.businessId && SENSITIVE_SURFACES.has(parsed.data.surface)) {
    const membership = await getMembership(parsed.data.businessId, session.user.id);
    const isPlatformAdmin = profile.role === "admin" || profile.role === "super_admin";
    if (!membership && !isPlatformAdmin) {
      return { success: false, error: "You do not have access to AI for this business" };
    }
  }

  const allowedActions = SURFACE_ACTIONS[parsed.data.surface];
  if (!allowedActions.includes(parsed.data.action as AiAssistAction)) {
    return { success: false, error: "Action not allowed for this surface" };
  }

  const { allowed } = await checkAssistantRateLimit();
  if (!allowed) {
    return { success: false, error: "Too many AI requests. Please wait a moment." };
  }

  const text = parsed.data.text ?? "";
  const context = {
    ...(parsed.data.context ?? {}),
    ...(parsed.data.targetLocale ? { targetLocale: parsed.data.targetLocale } : {}),
    assistAction: parsed.data.action,
  };

  try {
    if (parsed.data.businessId) {
      const workspace = await getBusinessAiWorkspace(parsed.data.businessId);
      if (workspace) {
        const { capability } = buildAssistPrompt({
          action: parsed.data.action as AiAssistAction,
          text,
          context,
        });
        const result = await runCapability({
          workspaceId: workspace.id,
          capability,
          userId: session.user.id,
          prompt: text,
          context,
        });
        return { success: true, content: result.output, mode: result.mode };
      }
    }

    const result = await generateAssistCompletion({
      action: parsed.data.action as AiAssistAction,
      text,
      context,
    });
    return { success: true, content: result.content, mode: result.mode };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "AI assist failed",
    };
  }
}
