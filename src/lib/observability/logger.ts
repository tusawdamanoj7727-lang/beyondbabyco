type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  correlationId?: string;
  userId?: string;
  path?: string;
  durationMs?: number;
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  });
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatLog("debug", message, context));
    }
  },
  info(message: string, context?: LogContext) {
    console.info(formatLog("info", message, context));
  },
  warn(message: string, context?: LogContext) {
    console.warn(formatLog("warn", message, context));
  },
  error(message: string, context?: LogContext & { error?: unknown }) {
    const err = context?.error instanceof Error ? { name: context.error.name, message: context.error.message, stack: context.error.stack } : context?.error;
    console.error(formatLog("error", message, { ...context, error: err }));
  },
};
