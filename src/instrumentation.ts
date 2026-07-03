import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validatePublicEnv, getProductionEnvWarnings } = await import("./lib/env.validation");
    const { logger } = await import("./lib/observability/logger");

    try {
      validatePublicEnv();
      const warnings = getProductionEnvWarnings();
      for (const w of warnings) {
        logger.warn("Production env warning", { message: w });
      }
      logger.info("Instrumentation registered");
    } catch (error) {
      logger.error("Startup env validation failed", { error });
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(error);
      }
    }
  }
}

export const onRequestError = Sentry.captureRequestError;
