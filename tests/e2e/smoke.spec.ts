import { test, expect } from "@playwright/test";

test.describe("public pages", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Nexar/i);
  });

  test("health endpoint returns JSON", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBeTruthy();
    expect(body.checks).toBeTruthy();
  });

  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("API protection", () => {
  test("cron routes reject unauthenticated requests", async ({ request }) => {
    const response = await request.get("/api/cron/verify-payments");
    expect(response.status()).toBe(401);
  });

  test("admin export requires authentication", async ({ request }) => {
    const response = await request.get("/api/admin/export/orders");
    expect([401, 403, 500]).toContain(response.status());
  });
});
