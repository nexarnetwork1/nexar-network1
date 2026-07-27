import { logger } from "./logger";

type TreasuryLogContext = Record<string, unknown>;

export const treasuryLogger = {
  info(message: string, context?: TreasuryLogContext): void {
    logger.info(`[treasury] ${message}`, context);
  },
  warn(message: string, context?: TreasuryLogContext): void {
    logger.warn(`[treasury] ${message}`, context);
  },
  error(message: string, context?: TreasuryLogContext): void {
    logger.error(`[treasury] ${message}`, context);
  },
};
