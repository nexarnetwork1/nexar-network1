import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../../..");

describe("Phase 12 — Wallet Super Admin removed", () => {
  it("deletes wallet admin API routes", () => {
    expect(
      existsSync(path.join(root, "app/api/admin/wallet/challenge/route.ts")),
    ).toBe(false);
    expect(
      existsSync(path.join(root, "app/api/admin/wallet/verify/route.ts")),
    ).toBe(false);
    expect(
      existsSync(path.join(root, "app/api/admin/wallet/status/route.ts")),
    ).toBe(false);
    expect(
      existsSync(path.join(root, "lib/admin/session.ts")),
    ).toBe(false);
    expect(
      existsSync(path.join(root, "components/web3/SuperAdminVerifyButton.tsx")),
    ).toBe(false);
  });

  it("provides Platform Owner wizard entry", () => {
    expect(existsSync(path.join(root, "app/admin/setup/page.tsx"))).toBe(true);
    expect(existsSync(path.join(root, "app/api/hq/bootstrap/route.ts"))).toBe(
      true,
    );
  });

  it("provides marketing route foundations", () => {
    for (const page of ["pricing", "blog", "developers", "documentation"]) {
      expect(existsSync(path.join(root, `app/${page}/page.tsx`))).toBe(true);
    }
  });
});
