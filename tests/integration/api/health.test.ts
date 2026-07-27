import { describe, expect, it } from "vitest";
import { runHealthChecks } from "@/lib/monitoring/health";

describe("health checks", () => {
  it("returns structured health payload", async () => {
    const result = await runHealthChecks();
    expect(["healthy", "degraded", "unhealthy"]).toContain(result.status);
    expect(result.checks.app).toBe("ok");
    expect(result.timestamp).toBeTruthy();
  });
});
