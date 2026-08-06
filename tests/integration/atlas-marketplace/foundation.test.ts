/**
 * ATLAS Marketplace foundation integration — requires migration applied.
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

describe.skipIf(!hasDb)("ATLAS Marketplace foundation (live DB)", () => {
  beforeAll(() => {
    expect(SUPABASE_URL).toBeTruthy();
    expect(SERVICE).toBeTruthy();
  });

  it("atlas_marketplace core tables exist", async () => {
    const db = createAdminClient();
    for (const table of [
      "atlas_marketplace_storefronts",
      "atlas_marketplace_listings",
      "atlas_marketplace_offers",
      "atlas_marketplace_checkouts",
      "atlas_marketplace_shipments",
      "atlas_marketplace_monetization_ledger",
    ]) {
      const { error } = await db.from(table).select("id").limit(1);
      expect(error, table).toBeNull();
    }
  });

  it(
    "auto-provisions storefront when business is created",
    async () => {
      const userId = randomUUID();
      const email = `mkt-${randomBytes(4).toString("hex")}@example.com`;
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
        full_name: "Marketplace Probe",
        role: "merchant",
        profile_completed: true,
        wallet_address: wallet,
      });

      const slug = `mkt-biz-${randomBytes(3).toString("hex")}`;
      const bizRes = await api("POST", "/rest/v1/businesses", {
        owner_user_id: userId,
        legal_name: "Marketplace Probe Co",
        display_name: "Marketplace Probe Co",
        slug,
        status: "pending",
      });
      expect(bizRes.status).toBeLessThan(300);
      const business = Array.isArray(bizRes.body) ? bizRes.body[0] : bizRes.body;
      const businessId = (business as { id: string }).id;

      const sf = await api(
        "GET",
        `/rest/v1/atlas_marketplace_storefronts?business_id=eq.${businessId}&select=*`,
      );
      expect(Array.isArray(sf.body) && sf.body.length).toBe(1);

      await api("DELETE", `/rest/v1/businesses?id=eq.${businessId}`);
      await api("DELETE", `/rest/v1/profiles?id=eq.${userId}`);
      await api("DELETE", `/rest/v1/authjs_users?id=eq.${userId}`);
    },
    45_000,
  );
});
