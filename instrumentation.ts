export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Core first — outbox writer + integration spine
    const { registerAtlasCoreEventHandlers } = await import(
      "@/modules/atlas-core/events"
    );
    registerAtlasCoreEventHandlers();

    const { registerAtlasNetworkEventHandlers } = await import(
      "@/modules/atlas-network/events"
    );
    registerAtlasNetworkEventHandlers();

    const { registerAtlasPulseEventHandlers } = await import(
      "@/modules/atlas-pulse/events"
    );
    registerAtlasPulseEventHandlers();

    const { registerAtlasConnectEventHandlers } = await import(
      "@/modules/atlas-connect/events"
    );
    registerAtlasConnectEventHandlers();

    const { registerAtlasAiEventHandlers } = await import(
      "@/modules/atlas-ai/events"
    );
    registerAtlasAiEventHandlers();

    const { registerAtlasMarketplaceEventHandlers } = await import(
      "@/modules/atlas-marketplace/events"
    );
    registerAtlasMarketplaceEventHandlers();

    const { registerAtlasAppsEventHandlers } = await import(
      "@/modules/atlas-apps/events"
    );
    registerAtlasAppsEventHandlers();

    const { registerAtlasFinanceEventHandlers } = await import(
      "@/modules/atlas-finance/events"
    );
    registerAtlasFinanceEventHandlers();

    const { registerAtlasMobileEventHandlers } = await import(
      "@/modules/atlas-mobile/events"
    );
    registerAtlasMobileEventHandlers();

    const { registerAtlasNxrEventHandlers } = await import(
      "@/modules/atlas-nxr/events"
    );
    registerAtlasNxrEventHandlers();

    const { registerAtlasHqEventHandlers } = await import(
      "@/modules/atlas-hq/events"
    );
    registerAtlasHqEventHandlers();
  }

  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      enabled: process.env.NODE_ENV === "production",
    });
  }
}

export const onRequestError = async (
  error: Error,
  request: { path: string },
  context: { routerKind: string; routePath: string }
) => {
  if (process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error, {
      extra: { path: request.path, ...context },
    });
  }
};
