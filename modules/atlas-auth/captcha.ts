import "server-only";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
};

/** Server-side Cloudflare Turnstile verification. Never trust client-only flags. */
export async function verifyTurnstileToken(token: string | null | undefined): Promise<{
  ok: boolean;
  error?: string;
}> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "Human verification is not configured." };
    }
    return { ok: true };
  }

  if (!token?.trim()) {
    return { ok: false, error: "Complete human verification to continue." };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  const res = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    return { ok: false, error: "Human verification could not be verified. Try again." };
  }

  const data = (await res.json()) as TurnstileResponse;
  if (!data.success) {
    return { ok: false, error: "Human verification failed. Try again." };
  }

  return { ok: true };
}

export function isCaptchaConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}
