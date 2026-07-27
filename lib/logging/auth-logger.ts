import { logger } from "./logger";

type AuthLogContext = Record<string, unknown>;

export const authLogger = {
  info(message: string, context?: AuthLogContext): void {
    logger.info(`[auth] ${message}`, context);
  },
  warn(message: string, context?: AuthLogContext): void {
    logger.warn(`[auth] ${message}`, context);
  },
  error(message: string, context?: AuthLogContext): void {
    logger.error(`[auth] ${message}`, context);
  },
};
