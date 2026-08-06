#!/usr/bin/env node
/**
 * Live authentication probe — prints exact request/response evidence.
 * Uses fetch only (no supabase-js) for Node 20 compatibility.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";

const ROOT = new URL("..", import.meta.url).pathname;
mkdirSync(`${ROOT}/.tmp/auth-probe`, { recursive: true });
const envText = readFileSync(`${ROOT}/.env.local`, "utf8");
const env = Object.fromEntries(
  [...envText.matchAll(/^([A-Z0-9_]+)=["']?([^"'\n]*)["']?/gm)].map((m) => [m[1], m[2]]),
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = (env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const LOCAL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

const results = [];

function record(name, data) {
  results.push({ name, ...data, at: new Date().toISOString() });
  console.log(`\n======== ${name} ========`);
  console.log(JSON.stringify(data, null, 2));
}

async function fetchWithTimeout(url, init = {}, timeoutMs = 20_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function httpJson(method, url, { headers = {}, body, timeoutMs = 20_000 } = {}) {
  const init = { method, headers: { ...headers }, redirect: "manual" };
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
    init.headers["Content-Type"] = init.headers["Content-Type"] || "application/json";
  }
  let res;
  try {
    res = await fetchWithTimeout(url, init, timeoutMs);
  } catch (err) {
    return {
      httpStatus: 0,
      requestUrl: url,
      requestMethod: method,
      responseBody: { error: String(err), name: err?.name },
      supabaseErrorCode: null,
      location: null,
    };
  }
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* keep text */
  }
  return {
    httpStatus: res.status,
    requestUrl: url,
    requestMethod: method,
    responseBody: json ?? text,
    supabaseErrorCode: json?.error_code ?? json?.code ?? null,
    location: res.headers.get("location"),
  };
}

function authHeaders(key = ANON) {
  return { apikey: key, Authorization: `Bearer ${key}` };
}

function randEmail(prefix) {
  return `${prefix}-${randomBytes(4).toString("hex")}@example.com`;
}

function wallet() {
  return `0x${randomBytes(20).toString("hex")}`;
}

async function test1_emailSignup() {
  const email = randEmail("auth-probe-customer");
  const password = "ProbePass123!";
  const url = `${SUPABASE_URL}/auth/v1/signup`;
  const res = await httpJson("POST", url, {
    headers: authHeaders(),
    body: {
      email,
      password,
      data: {
        full_name: "Probe Customer",
        wallet_address: wallet(),
        role: "customer",
      },
      email_redirect_to: `${APP_URL}/auth/callback`,
    },
  });
  const pass =
    (res.httpStatus === 200 || res.httpStatus === 201) &&
    Boolean(res.responseBody?.id || res.responseBody?.user?.id || res.responseBody?.access_token);
  // GoTrue may return user at top-level or nested
  const userId =
    res.responseBody?.user?.id ||
    res.responseBody?.id ||
    null;
  record("1. Email signup", {
    pass: pass || ((res.httpStatus === 200 || res.httpStatus === 201) && !res.supabaseErrorCode),
    httpStatus: res.httpStatus,
    requestUrl: url,
    responseBody: res.responseBody,
    supabaseErrorCode: res.supabaseErrorCode,
    browserConsoleError: null,
    serverLog: null,
  });
  return { email, password, userId, res };
}

async function test2_emailDelivery(signup) {
  const settings = await httpJson("GET", `${SUPABASE_URL}/auth/v1/settings`, {
    headers: authHeaders(),
  });
  const resendUrl = `${SUPABASE_URL}/auth/v1/resend`;
  const resend = await httpJson("POST", resendUrl, {
    headers: authHeaders(),
    body: {
      type: "signup",
      email: signup.email,
      email_redirect_to: `${APP_URL}/auth/callback`,
    },
  });
  const signupRateLimited =
    signup.res.supabaseErrorCode === "over_email_send_rate_limit" ||
    String(signup.res.responseBody?.msg || signup.res.responseBody?.message || "").includes(
      "rate limit",
    );
  const resendRateLimited =
    resend.supabaseErrorCode === "over_email_send_rate_limit" ||
    String(resend.responseBody?.msg || resend.responseBody?.message || "").includes("rate limit");
  const pass =
    !signupRateLimited &&
    !resendRateLimited &&
    (resend.httpStatus === 200 || resend.httpStatus === 201);
  record("2. Email verification email delivery", {
    pass,
    httpStatus: resend.httpStatus,
    requestUrl: resendUrl,
    responseBody: resend.responseBody,
    supabaseErrorCode: resend.supabaseErrorCode,
    browserConsoleError: null,
    serverLog: null,
    authSettingsSelected: {
      disable_signup: settings.responseBody?.disable_signup,
      mailer_autoconfirm: settings.responseBody?.mailer_autoconfirm,
      external_email: settings.responseBody?.external?.email,
    },
    signupEvidence: {
      httpStatus: signup.res.httpStatus,
      supabaseErrorCode: signup.res.supabaseErrorCode,
      responseBody: signup.res.responseBody,
      requestUrl: signup.res.requestUrl,
    },
  });
}

async function test3_confirmationCallback(signup) {
  let generate = null;
  let exchange = null;
  let pass = false;

  if (SERVICE) {
    const createUrl = `${SUPABASE_URL}/auth/v1/admin/users`;
    const probeEmail = randEmail("auth-probe-confirm");
    const password = "ProbePass123!";
    const created = await httpJson("POST", createUrl, {
      headers: authHeaders(SERVICE),
      body: {
        email: probeEmail,
        password,
        email_confirm: false,
        user_metadata: { full_name: "Confirm Probe", role: "customer" },
      },
    });
    generate = { createUser: created };
    const userId = created.responseBody?.id || created.responseBody?.user?.id;
    if (userId && (created.httpStatus === 200 || created.httpStatus === 201)) {
      const linkUrl = `${SUPABASE_URL}/auth/v1/admin/generate_link`;
      const link = await httpJson("POST", linkUrl, {
        headers: authHeaders(SERVICE),
        body: {
          type: "signup",
          email: probeEmail,
          password,
          redirect_to: `${APP_URL}/auth/callback`,
        },
      });
      generate.generateLink = link;
      const actionLink =
        link.responseBody?.action_link ||
        link.responseBody?.properties?.action_link ||
        null;
      generate.actionLink = actionLink;

      if (actionLink) {
        const follow = await fetch(actionLink, { redirect: "manual" });
        const followLoc = follow.headers.get("location");
        const followBody = await follow.text().catch(() => "");
        generate.actionLinkFollow = {
          httpStatus: follow.status,
          requestUrl: actionLink,
          location: followLoc,
          responseBody: followBody.slice(0, 2000),
        };

        let code = null;
        try {
          if (followLoc) code = new URL(followLoc).searchParams.get("code");
          if (!code) code = new URL(actionLink).searchParams.get("code");
        } catch {
          /* ignore */
        }

        if (code) {
          const callbackUrl = `${LOCAL}/auth/callback?code=${encodeURIComponent(code)}`;
          const cb = await fetch(callbackUrl, { redirect: "manual" });
          const cbBody = await cb.text().catch(() => "");
          const cbLoc = cb.headers.get("location");
          exchange = {
            httpStatus: cb.status,
            requestUrl: callbackUrl,
            responseBody: cbBody.slice(0, 2000),
            location: cbLoc,
            supabaseErrorCode: null,
          };
          const loc = cbLoc || "";
          pass =
            (cb.status === 307 || cb.status === 302 || cb.status === 303) &&
            !loc.includes("auth_callback_failed");
        } else {
          const props = link.responseBody?.properties || link.responseBody || {};
          const tokenHash = props.hashed_token || props.token_hash;
          const type = props.verification_type || "signup";
          if (tokenHash) {
            const verifyUrl = `${SUPABASE_URL}/auth/v1/verify`;
            const verified = await httpJson("POST", verifyUrl, {
              headers: authHeaders(),
              body: { type, token_hash: tokenHash },
            });
            exchange = {
              httpStatus: verified.httpStatus,
              requestUrl: verifyUrl,
              responseBody: verified.responseBody,
              supabaseErrorCode: verified.supabaseErrorCode,
              note: "No PKCE code on action_link; used /verify",
            };
            pass =
              verified.httpStatus === 200 &&
              Boolean(verified.responseBody?.access_token);
          }
        }
      }

      await httpJson("DELETE", `${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        headers: authHeaders(SERVICE),
      }).catch(() => null);
    }
  } else {
    generate = { error: "SUPABASE_SERVICE_ROLE_KEY missing" };
  }

  const invalidUrl = `${LOCAL}/auth/callback?code=invalid-probe-code`;
  const invalid = await fetch(invalidUrl, { redirect: "manual" });
  const invalidBody = await invalid.text().catch(() => "");
  const invalidLoc = invalid.headers.get("location");

  record("3. Email confirmation callback", {
    pass,
    httpStatus: exchange?.httpStatus ?? invalid.status,
    requestUrl: exchange?.requestUrl ?? invalidUrl,
    responseBody: exchange?.responseBody ?? invalidBody.slice(0, 2000),
    supabaseErrorCode: exchange?.supabaseErrorCode ?? null,
    browserConsoleError: null,
    serverLog: null,
    redirectLocation: exchange?.location ?? invalidLoc,
    generate,
    invalidCodeProbe: {
      httpStatus: invalid.status,
      requestUrl: invalidUrl,
      location: invalidLoc,
      responseBody: invalidBody.slice(0, 1000),
    },
    signupUserId: signup.userId,
  });
}

async function test4_emailLogin(signup) {
  const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const res = await httpJson("POST", url, {
    headers: authHeaders(),
    body: { email: signup.email, password: signup.password },
  });
  const pass = res.httpStatus === 200 && Boolean(res.responseBody?.access_token);
  record("4. Email login", {
    pass,
    httpStatus: res.httpStatus,
    requestUrl: url,
    responseBody: res.responseBody,
    supabaseErrorCode: res.supabaseErrorCode,
    browserConsoleError: null,
    serverLog: null,
  });
}

async function test5_googleOAuth() {
  const redirectTo = `${APP_URL}/auth/callback`;
  const url = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
  const res = await fetch(url, {
    redirect: "manual",
    headers: authHeaders(),
  });
  const body = await res.text().catch(() => "");
  const location = res.headers.get("location");
  const pass =
    (res.status === 302 || res.status === 303 || res.status === 307) &&
    Boolean(location) &&
    /google/i.test(location || "");
  record("5. Google OAuth login", {
    pass,
    httpStatus: res.status,
    requestUrl: url,
    responseBody: body.slice(0, 2000),
    supabaseErrorCode: null,
    browserConsoleError: null,
    serverLog: null,
    location,
    note: "Initiation only — Google consent UI is interactive",
  });
}

async function test6_walletLogin() {
  const requestUrl = `${LOCAL}/marketplace?auth=signin`;
  const marketplace = await fetch(requestUrl, { redirect: "manual" });
  const html = await marketplace.text();
  record("6. Wallet login", {
    pass: false,
    httpStatus: marketplace.status,
    requestUrl,
    responseBody: html.slice(0, 800),
    supabaseErrorCode: null,
    browserConsoleError: null,
    serverLog: null,
    privyAppIdConfigured: Boolean(env.NEXT_PUBLIC_PRIVY_APP_ID),
    exactFailingRequest: null,
    note: "No HTTP Auth request exists for wallet login. App calls Privy login() only (NexarCommerceAuthModal WalletConnect). Cannot complete wallet auth without interactive Privy/wallet UI; no Supabase /auth/v1 call is made.",
  });
}

async function test7_customerRegistration() {
  const email = randEmail("auth-probe-cust-reg");
  const password = "ProbePass123!";
  const url = `${SUPABASE_URL}/auth/v1/signup`;
  const res = await httpJson("POST", url, {
    headers: authHeaders(),
    body: {
      email,
      password,
      data: {
        full_name: "Customer Reg Probe",
        wallet_address: wallet(),
        role: "customer",
      },
      email_redirect_to: `${APP_URL}/auth/callback`,
    },
  });
  const userId = res.responseBody?.user?.id || res.responseBody?.id || null;
  let profile = null;
  if (userId && SERVICE) {
    await new Promise((r) => setTimeout(r, 700));
    const q = await httpJson(
      "GET",
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,email,role,profile_completed`,
      { headers: { ...authHeaders(SERVICE), Accept: "application/json" } },
    );
    profile = q;
    await httpJson("DELETE", `${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      headers: authHeaders(SERVICE),
    }).catch(() => null);
  }
  const pass =
    (res.httpStatus === 200 || res.httpStatus === 201) &&
    !res.supabaseErrorCode &&
    Boolean(userId);
  record("7. Customer registration", {
    pass,
    httpStatus: res.httpStatus,
    requestUrl: url,
    responseBody: res.responseBody,
    supabaseErrorCode: res.supabaseErrorCode,
    browserConsoleError: null,
    serverLog: null,
    profile,
  });
}

async function test8_merchantRegistration() {
  const email = randEmail("auth-probe-merch-reg");
  const password = "ProbePass123!";
  const url = `${SUPABASE_URL}/auth/v1/signup`;
  const res = await httpJson("POST", url, {
    headers: authHeaders(),
    body: {
      email,
      password,
      data: {
        full_name: "Merchant Reg Probe",
        role: "merchant",
        store_name: "Probe Store",
        business_type: "retail",
        wallet_address: wallet(),
        mode: "marketplace",
      },
      email_redirect_to: `${APP_URL}/auth/callback`,
    },
  });
  const userId = res.responseBody?.user?.id || res.responseBody?.id || null;
  let profile = null;
  if (userId && SERVICE) {
    await new Promise((r) => setTimeout(r, 700));
    const q = await httpJson(
      "GET",
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,email,role,profile_completed`,
      { headers: { ...authHeaders(SERVICE), Accept: "application/json" } },
    );
    profile = q;
    await httpJson("DELETE", `${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      headers: authHeaders(SERVICE),
    }).catch(() => null);
  }
  const pass =
    (res.httpStatus === 200 || res.httpStatus === 201) &&
    !res.supabaseErrorCode &&
    Boolean(userId);
  record("8. Merchant registration", {
    pass,
    httpStatus: res.httpStatus,
    requestUrl: url,
    responseBody: res.responseBody,
    supabaseErrorCode: res.supabaseErrorCode,
    browserConsoleError: null,
    serverLog: null,
    profile,
  });
}

async function main() {
  console.log(
    "AUTH PROBE CONFIG\n" +
      JSON.stringify(
        {
          SUPABASE_URL,
          APP_URL,
          LOCAL,
          anonPrefix: ANON?.slice(0, 24),
          hasService: Boolean(SERVICE),
        },
        null,
        2,
      ),
  );

  let health;
  try {
    const r = await fetchWithTimeout(`${LOCAL}/api/health`, {}, 30_000);
    health = { status: r.status, body: await r.text() };
  } catch (err) {
    health = { status: 0, body: String(err) };
  }
  console.log("LOCAL_HEALTH", health);
  if (health.status !== 200) {
    console.error("Local app not healthy — aborting");
    process.exit(2);
  }

  const signup = await test1_emailSignup();
  await test2_emailDelivery(signup);
  await test3_confirmationCallback(signup);
  await test4_emailLogin(signup);
  await test5_googleOAuth();
  await test6_walletLogin();
  await test7_customerRegistration();
  await test8_merchantRegistration();

  writeFileSync(
    `${ROOT}/.tmp/auth-probe/results.json`,
    JSON.stringify(results, null, 2),
  );
  console.log("\n======== PASS/FAIL MATRIX ========");
  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"} | ${r.name}`);
  }
  process.exit(results.some((r) => !r.pass) ? 1 : 0);
}

main().catch((err) => {
  console.error("PROBE_FATAL", err);
  process.exit(2);
});
