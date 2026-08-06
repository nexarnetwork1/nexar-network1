import { describe, expect, it, beforeAll } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcrypt";

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
const SUPABASE_URL = fileEnv.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = fileEnv.SUPABASE_SERVICE_ROLE_KEY!;

function headers() {
  return {
    apikey: SERVICE,
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

describe("ATLAS Pulse foundation (live DB)", () => {
  beforeAll(() => {
    expect(SUPABASE_URL).toBeTruthy();
    expect(SERVICE).toBeTruthy();
  });

  it(
    "auto-provisions pulse feed + timeline when business is created",
    async () => {
      const userId = randomUUID();
      const email = `pulse-${randomBytes(4).toString("hex")}@example.com`;
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
        full_name: "Pulse Probe",
        role: "merchant",
        profile_completed: true,
        wallet_address: wallet,
      });

      const slug = `pulse-biz-${randomBytes(3).toString("hex")}`;
      const bizRes = await api("POST", "/rest/v1/businesses", {
        owner_user_id: userId,
        legal_name: "Pulse Probe Co",
        display_name: "Pulse Probe Co",
        slug,
        status: "pending",
      });
      expect(bizRes.status).toBeLessThan(300);
      const business = Array.isArray(bizRes.body) ? bizRes.body[0] : bizRes.body;
      const businessId = (business as { id: string }).id;

      const timeline = await api(
        "GET",
        `/rest/v1/atlas_pulse_timelines?business_id=eq.${businessId}&select=*`,
      );
      expect(Array.isArray(timeline.body) && timeline.body.length).toBe(1);

      const feedId = (timeline.body as Array<{ feed_id: string }>)[0].feed_id;
      const items = await api(
        "GET",
        `/rest/v1/atlas_pulse_feed_items?feed_id=eq.${feedId}&select=*`,
      );
      expect(Array.isArray(items.body) && items.body.length).toBeGreaterThan(0);

      await api("DELETE", `/rest/v1/atlas_pulse_feed_items?feed_id=eq.${feedId}`);
      await api("DELETE", `/rest/v1/atlas_pulse_timelines?business_id=eq.${businessId}`);
      await api("DELETE", `/rest/v1/atlas_pulse_feeds?id=eq.${feedId}`);
      await api("DELETE", `/rest/v1/businesses?id=eq.${businessId}`);
      await api("DELETE", `/rest/v1/profiles?id=eq.${userId}`);
      await api("DELETE", `/rest/v1/authjs_users?id=eq.${userId}`);
    },
    45_000,
  );
});
