import { loggingConfig, type LogLevel } from "@/config/logging";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

type LogContext = Record<string, unknown>;

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[loggingConfig.level];
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const ctx = context ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctx}`;
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog("debug") && loggingConfig.enableConsole) {
      console.debug(formatMessage("debug", message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    if (shouldLog("info") && loggingConfig.enableConsole) {
      console.info(formatMessage("info", message, context));
    }
  },

  warn(message: string, context?: LogContext): void {
    if (shouldLog("warn") && loggingConfig.enableConsole) {
      console.warn(formatMessage("warn", message, context));
    }
  },

  error(message: string, context?: LogContext): void {
    if (shouldLog("error") && loggingConfig.enableConsole) {
      console.error(formatMessage("error", message, context));
    }
  },
};
