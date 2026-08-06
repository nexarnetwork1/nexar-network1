import { describe, expect, it, beforeAll } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcrypt";
import { ownerOf, resolvePermissions, hasPermission } from "@/domains";

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

describe("Business Hub foundation (live DB)", () => {
  beforeAll(() => {
    expect(SUPABASE_URL).toBeTruthy();
    expect(SERVICE).toBeTruthy();
    expect(SUPABASE_URL).not.toContain("example.supabase.co");
  });

  it(
    "creates business + membership + links store without breaking stores schema",
    async () => {
      const userId = randomUUID();
      const email = `bizhub-${randomBytes(4).toString("hex")}@example.com`;
      const wallet = `0x${randomBytes(20).toString("hex")}`;
      const password = await bcrypt.hash("ProbePass123!", 10);

      const userRes = await api("POST", "/rest/v1/authjs_users", {
        id: userId,
        email,
        name: "Biz Hub Probe",
        password,
        emailVerified: new Date().toISOString(),
      });
      expect(userRes.status).toBeLessThan(300);

      const profileRes = await api("POST", "/rest/v1/profiles", {
        id: userId,
        email,
        full_name: "Biz Hub Probe",
        role: "merchant",
        profile_completed: true,
        wallet_address: wallet,
      });
      if (profileRes.status >= 300) {
        console.error("profile insert", profileRes);
      }
      expect(profileRes.status).toBeLessThan(300);

      const slug = `probe-store-${randomBytes(3).toString("hex")}`;
      const storeRes = await api("POST", "/rest/v1/stores", {
        owner_id: userId,
        name: "Probe Store",
        slug,
        business_type: "retail",
        mode: "marketplace",
        status: "pending",
        wallet_address: wallet,
      });
      if (storeRes.status >= 300) {
        console.error("store insert", storeRes);
      }
      expect(storeRes.status).toBeLessThan(300);
      const store = Array.isArray(storeRes.body)
        ? storeRes.body[0]
        : storeRes.body;
      expect(store).toBeTruthy();
      expect((store as { business_id?: string }).business_id).toBeTruthy();

      const businessId = (store as { business_id: string }).business_id;
      const biz = await api(
        "GET",
        `/rest/v1/businesses?id=eq.${businessId}&select=*`,
      );
      expect(Array.isArray(biz.body) && biz.body.length).toBe(1);

      const mem = await api(
        "GET",
        `/rest/v1/business_memberships?business_id=eq.${businessId}&user_id=eq.${userId}&select=*`,
      );
      expect(Array.isArray(mem.body) && mem.body.length).toBe(1);
      expect((mem.body as Array<{ role: string }>)[0].role).toBe("owner");

      // Cleanup (store first due to primary_store_id)
      await api("DELETE", `/rest/v1/stores?id=eq.${(store as { id: string }).id}`);
      await api("DELETE", `/rest/v1/business_memberships?business_id=eq.${businessId}`);
      await api("DELETE", `/rest/v1/businesses?id=eq.${businessId}`);
      await api("DELETE", `/rest/v1/profiles?id=eq.${userId}`);
      await api("DELETE", `/rest/v1/authjs_users?id=eq.${userId}`);
    },
    45_000,
  );

  it("ownership + permissions contracts remain coherent", () => {
    expect(ownerOf("Store")).toBe("businessHub");
    expect(ownerOf("Product")).toBe("businessHub");
    expect(ownerOf("Listing")).toBe("marketplace");
    const perms = resolvePermissions({
      platformRole: "business",
      businessMembership: "owner",
    });
    expect(hasPermission(perms, "business:members:manage")).toBe(true);
    expect(hasPermission(perms, "catalog:product:publish")).toBe(true);
  });
});
