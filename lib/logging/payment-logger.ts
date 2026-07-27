import { logger } from "./logger";

type PaymentLogContext = Record<string, unknown>;

export const paymentLogger = {
  info(message: string, context?: PaymentLogContext): void {
    logger.info(`[payment] ${message}`, context);
  },
  warn(message: string, context?: PaymentLogContext): void {
    logger.warn(`[payment] ${message}`, context);
  },
  error(message: string, context?: PaymentLogContext): void {
    logger.error(`[payment] ${message}`, context);
  },
};
