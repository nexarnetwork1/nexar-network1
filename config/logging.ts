import { env } from "./env";

export const loggingConfig = {
  level: env.LOG_LEVEL,
  enableConsole: env.NODE_ENV !== "production",
  enableSentry: Boolean(env.SENTRY_DSN),
  audit: {
    enabled: true,
    tableName: "audit_logs",
  },
  security: {
    enabled: true,
    logFailedAuth: true,
    logRateLimitHits: true,
  },
} as const;

export type LogLevel = (typeof loggingConfig)["level"];
