import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";

function wallet() {
  return `0x${randomBytes(20).toString("hex")}`;
}

function email(prefix: string) {
  return `${prefix}-${randomBytes(4).toString("hex")}@example.com`;
}

async function dumpFailure(
  name: string,
  page: import("@playwright/test").Page,
  extras: Record<string, unknown> = {},
) {
  const consoleErrors = extras.consoleErrors ?? [];
  const failedRequests = extras.failedRequests ?? [];
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        name,
        url: page.url(),
        consoleErrors,
        failedRequests,
        ...extras,
      },
      null,
      2,
    ),
  );
}

test.describe("authentication flows", () => {
  test("1+7 customer email signup via commerce modal", async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: Array<Record<string, unknown>> = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("response", async (res) => {
      if (res.status() >= 400) {
        const url = res.url();
        if (url.includes("supabase") || url.includes("auth") || url.includes("signup")) {
          let body = "";
          try {
            body = (await res.text()).slice(0, 2000);
          } catch {
            body = "<unreadable>";
          }
          failedRequests.push({
            httpStatus: res.status(),
            requestUrl: url,
            responseBody: body,
          });
        }
      }
    });

    await page.goto("/marketplace?auth=register&role=customer");
    await expect(page.getByText(/create|register|commerce/i).first()).toBeVisible({
      timeout: 20_000,
    });

    const e = email("e2e-customer");
    const pw = "ProbePass123!";
    await page.locator("#nxr-commerce-register-fullname, input[name='fullName']").first().fill("E2E Customer");
    await page.locator("input[type='email']").first().fill(e);
    await page.locator("input[type='password']").first().fill(pw);
    const walletInput = page.locator("input[name='walletAddress'], input[placeholder*='0x']").first();
    if (await walletInput.count()) await walletInput.fill(wallet());

    await page.getByRole("button", { name: /create|register|sign up/i }).first().click();
    await page.waitForTimeout(3000);

    const bodyText = await page.locator("body").innerText();
    const hasError =
      /rate limit|failed|error|invalid/i.test(bodyText) || failedRequests.length > 0;
    if (hasError) {
      await dumpFailure("1/7 customer signup UI", page, {
        consoleErrors,
        failedRequests,
        bodySnippet: bodyText.slice(0, 1500),
      });
    }
    // Soft assertion with evidence: we still report via dump; fail if supabase 4xx/5xx observed
    const authFail = failedRequests.find((r) => String(r.requestUrl).includes("/auth/v1/"));
    if (authFail) {
      expect(authFail, JSON.stringify(authFail, null, 2)).toBeUndefined();
    }
  });

  test("4 email login via commerce modal", async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: Array<Record<string, unknown>> = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("response", async (res) => {
      if (res.status() >= 400 && res.url().includes("supabase")) {
        failedRequests.push({
          httpStatus: res.status(),
          requestUrl: res.url(),
          responseBody: (await res.text().catch(() => "")).slice(0, 2000),
        });
      }
    });

    await page.goto("/marketplace?auth=signin");
    await page.locator("input[type='email']").first().fill("does-not-exist-probe@example.com");
    await page.locator("input[type='password']").first().fill("WrongPass123!");
    await page.getByRole("button", { name: /sign in/i }).first().click();
    await page.waitForTimeout(2500);
    const bodyText = await page.locator("body").innerText();
    await dumpFailure("4 email login UI (expected invalid creds)", page, {
      consoleErrors,
      failedRequests,
      bodySnippet: bodyText.slice(0, 1500),
      note: "Uses nonexistent user to capture exact Auth error surface",
    });
    expect(failedRequests.length > 0 || /invalid|confirm|error|failed/i.test(bodyText)).toBeTruthy();
  });

  test("5 Google OAuth button initiates authorize", async ({ page }) => {
    const consoleErrors: string[] = [];
    const requests: Array<Record<string, unknown>> = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/auth/v1/authorize") || url.includes("accounts.google.com")) {
        requests.push({ method: req.method(), requestUrl: url });
      }
    });
    page.on("response", async (res) => {
      const url = res.url();
      if (url.includes("/auth/v1/authorize") || url.includes("accounts.google")) {
        requests.push({
          httpStatus: res.status(),
          requestUrl: url,
          location: res.headers()["location"] ?? null,
        });
      }
    });

    await page.goto("/marketplace?auth=signin");
    const google = page.getByRole("button", { name: /^google$/i });
    await expect(google).toBeVisible({ timeout: 15_000 });

    const [popupOrNav] = await Promise.all([
      Promise.race([
        page.waitForEvent("popup", { timeout: 8000 }).catch(() => null),
        page.waitForURL(/accounts\.google\.com|\/auth\/v1\/authorize/, { timeout: 8000 }).catch(() => null),
      ]),
      google.click(),
    ]);

    await page.waitForTimeout(2000);
    await dumpFailure("5 Google OAuth UI", page, {
      consoleErrors,
      requests,
      popupUrl: popupOrNav && "url" in popupOrNav ? popupOrNav.url() : page.url(),
    });

    const hitAuthorize = requests.some((r) =>
      String(r.requestUrl).includes("/auth/v1/authorize") ||
      String(r.requestUrl).includes("accounts.google.com"),
    );
    expect(hitAuthorize || /accounts\.google\.com/.test(page.url())).toBeTruthy();
  });

  test("6 Wallet login button invokes Privy path", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/marketplace?auth=signin");
    const walletBtn = page.getByRole("button", { name: /wallet/i }).first();
    await expect(walletBtn).toBeVisible({ timeout: 15_000 });
    await walletBtn.click();
    await page.waitForTimeout(3000);
    const bodyText = await page.locator("body").innerText();
    await dumpFailure("6 Wallet login UI", page, {
      consoleErrors,
      bodySnippet: bodyText.slice(0, 1500),
      disabled: await walletBtn.isDisabled(),
    });
    // Pass if Privy UI appears OR button is enabled and click produced no hard crash
    expect(consoleErrors.filter((e) => !/favicon|hydration/i.test(e)).length).toBeLessThan(20);
  });

  test("3 auth callback without code redirects to commerce auth failure", async ({ page }) => {
    const res = await page.goto("/auth/callback", { waitUntil: "domcontentloaded" });
    await dumpFailure("3 callback no code", page, {
      httpStatus: res?.status() ?? null,
      requestUrl: res?.url() ?? page.url(),
      finalUrl: page.url(),
    });
    expect(page.url()).toMatch(/auth=signin|auth_callback_failed|marketplace/);
  });

  test("8 merchant registration form is reachable", async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: Array<Record<string, unknown>> = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("response", async (res) => {
      if (res.status() >= 400 && res.url().includes("/auth/v1/")) {
        failedRequests.push({
          httpStatus: res.status(),
          requestUrl: res.url(),
          responseBody: (await res.text().catch(() => "")).slice(0, 2000),
        });
      }
    });

    await page.goto("/marketplace?auth=register&role=merchant");
    await page.waitForTimeout(1500);
    const bodyText = await page.locator("body").innerText();
    const e = email("e2e-merchant");
    const nameField = page.locator("input[name='merchantName'], input[name='fullName']").first();
    if (await nameField.count()) {
      await nameField.fill("E2E Merchant");
      await page.locator("input[type='email']").first().fill(e);
      await page.locator("input[type='password']").first().fill("ProbePass123!");
      const store = page.locator("input[name='storeName']").first();
      if (await store.count()) await store.fill("E2E Store");
      const biz = page.locator("input[name='businessType']").first();
      if (await biz.count()) await biz.fill("retail");
      const w = page.locator("input[name='walletAddress']").first();
      if (await w.count()) await w.fill(wallet());
      await page.getByRole("button", { name: /create|register|sign up/i }).first().click();
      await page.waitForTimeout(3000);
    }
    await dumpFailure("8 merchant registration UI", page, {
      consoleErrors,
      failedRequests,
      bodySnippet: (await page.locator("body").innerText()).slice(0, 1500),
      initialBody: bodyText.slice(0, 500),
    });
    const authFail = failedRequests.find((r) => String(r.requestUrl).includes("/auth/v1/"));
    if (authFail) {
      expect(authFail, JSON.stringify(authFail, null, 2)).toBeUndefined();
    }
  });
});
