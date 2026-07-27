import { logger } from "./logger";

type BlockchainLogContext = Record<string, unknown>;

export const blockchainLogger = {
  info(message: string, context?: BlockchainLogContext): void {
    logger.info(`[blockchain] ${message}`, context);
  },
  warn(message: string, context?: BlockchainLogContext): void {
    logger.warn(`[blockchain] ${message}`, context);
  },
  error(message: string, context?: BlockchainLogContext): void {
    logger.error(`[blockchain] ${message}`, context);
  },
};
