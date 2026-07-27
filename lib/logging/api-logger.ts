import { logger } from "./logger";

type ApiLogContext = Record<string, unknown>;

export const apiLogger = {
  info(message: string, context?: ApiLogContext): void {
    logger.info(`[api] ${message}`, context);
  },
  warn(message: string, context?: ApiLogContext): void {
    logger.warn(`[api] ${message}`, context);
  },
  error(message: string, context?: ApiLogContext): void {
    logger.error(`[api] ${message}`, context);
  },
};
