/**
 * ATLAS AI foundation integration — requires migration applied.
 * Run after: supabase db push
 */
import { describe, expect, it, beforeAll } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcrypt";
import { createAdminClient } from "@/lib/supabase/admin";

function loadEnvLocal() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    const out: Record<string, string> = {};
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=["']?([^"'\n]*)["']?/);
      if (m) out[m[1]] = m[2];
    }
    return out;
  } catch {
    return {};
  }
}

const fileEnv = loadEnvLocal();
const SUPABASE_URL =
  fileEnv.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE =
  fileEnv.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasDb = Boolean(SUPABASE_URL && SERVICE);

function headers() {
  return {
    apikey: SERVICE!,
    Authorization: `Bearer ${SERVICE}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: headers(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown = text;
  try {
    json = JSON.parse(text);
  } catch {
    /* keep */
  }
  return { status: res.status, body: json, text };
}

describe.skipIf(!hasDb)("ATLAS AI foundation (live DB)", () => {
  beforeAll(() => {
    expect(SUPABASE_URL).toBeTruthy();
    expect(SERVICE).toBeTruthy();
  });

  it("atlas_ai core tables exist", async () => {
    const db = createAdminClient();
    for (const table of [
      "atlas_ai_workspaces",
      "atlas_ai_agents",
      "atlas_ai_conversations",
      "atlas_ai_memories",
      "atlas_ai_knowledge_items",
      "atlas_ai_vector_documents",
      "atlas_ai_workflows",
      "atlas_ai_insights",
    ]) {
      const { error } = await db.from(table).select("id").limit(1);
      expect(error, table).toBeNull();
    }
  });

  it(
    "auto-provisions AI workspace + agents when business is created",
    async () => {
      const userId = randomUUID();
      const email = `ai-${randomBytes(4).toString("hex")}@example.com`;
      const wallet = `0x${randomBytes(20).toString("hex")}`;
      const password = await bcrypt.hash("ProbePass123!", 10);

      await api("POST", "/rest/v1/authjs_users", {
        id: userId,
        email,
        password,
        emailVerified: new Date().toISOString(),
      });
      await api("POST", "/rest/v1/profiles", {
        id: userId,
        email,
        full_name: "AI Probe",
        role: "merchant",
        profile_completed: true,
        wallet_address: wallet,
      });

      const slug = `ai-biz-${randomBytes(3).toString("hex")}`;
      const bizRes = await api("POST", "/rest/v1/businesses", {
        owner_user_id: userId,
        legal_name: "AI Probe Co",
        display_name: "AI Probe Co",
        slug,
        status: "pending",
      });
      expect(bizRes.status).toBeLessThan(300);
      const business = Array.isArray(bizRes.body) ? bizRes.body[0] : bizRes.body;
      const businessId = (business as { id: string }).id;

      const wsRes = await api(
        "GET",
        `/rest/v1/atlas_ai_workspaces?business_id=eq.${businessId}&select=*`,
      );
      expect(Array.isArray(wsRes.body) && wsRes.body.length).toBe(1);
      const workspaceId = (wsRes.body as Array<{ id: string }>)[0].id;

      const agents = await api(
        "GET",
        `/rest/v1/atlas_ai_agents?workspace_id=eq.${workspaceId}&select=slug`,
      );
      const slugs = (agents.body as Array<{ slug: string }>).map((a) => a.slug);
      expect(slugs.length).toBeGreaterThanOrEqual(4);
      expect(slugs).toEqual(expect.arrayContaining(["ceo", "sales", "finance"]));

      const workflows = await api(
        "GET",
        `/rest/v1/atlas_ai_workflows?workspace_id=eq.${workspaceId}&slug=eq.order-created&select=*`,
      );
      expect(Array.isArray(workflows.body) && workflows.body.length).toBe(1);

      await api("DELETE", `/rest/v1/businesses?id=eq.${businessId}`);
      await api("DELETE", `/rest/v1/profiles?id=eq.${userId}`);
      await api("DELETE", `/rest/v1/authjs_users?id=eq.${userId}`);
    },
    45_000,
  );
});
