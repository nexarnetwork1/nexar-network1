/**
 * Optional Sentry integration — active only when SENTRY_DSN is set.
 */

type ErrorContext = Record<string, unknown>;

let sentryInitialized = false;

async function initSentry() {
  if (sentryInitialized || !process.env.SENTRY_DSN) return null;

  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      enabled: process.env.NODE_ENV === "production",
    });
    sentryInitialized = true;
    return Sentry;
  } catch {
    return null;
  }
}

export async function captureException(
  error: unknown,
  context?: ErrorContext
): Promise<void> {
  const Sentry = await initSentry();
  if (Sentry) {
    Sentry.captureException(error, { extra: context });
  } else if (process.env.NODE_ENV !== "production") {
    console.error("[error]", error, context);
  }
}

export async function captureMessage(
  message: string,
  context?: ErrorContext
): Promise<void> {
  const Sentry = await initSentry();
  if (Sentry) {
    Sentry.captureMessage(message, { extra: context });
  }
}
