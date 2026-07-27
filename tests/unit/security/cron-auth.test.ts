import { describe, expect, it } from "vitest";
import {
  verifyCronSecret,
  cronUnauthorizedResponse,
} from "@/lib/security/cron-auth";

describe("cron-auth", () => {
  it("rejects missing secret", () => {
    const result = verifyCronSecret(new Request("http://localhost"), undefined);
    expect(result.authorized).toBe(false);
  });

  it("rejects invalid bearer token", () => {
    const request = new Request("http://localhost", {
      headers: { authorization: "Bearer wrong" },
    });
    const result = verifyCronSecret(request, "expected-secret");
    expect(result.authorized).toBe(false);
  });

  it("accepts valid bearer token", () => {
    const request = new Request("http://localhost", {
      headers: { authorization: "Bearer expected-secret" },
    });
    const result = verifyCronSecret(request, "expected-secret");
    expect(result.authorized).toBe(true);
  });

  it("returns 401 response", async () => {
    const response = cronUnauthorizedResponse();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });
});
