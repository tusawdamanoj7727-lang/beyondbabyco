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
    const { validateProductionRazorpayConfig } = await import("./lib/checkout/gateways");
    const { logger } = await import("./lib/observability/logger");

    try {
      validatePublicEnv();
      await validateProductionRazorpayConfig();
      const { isSmtpConfigured } = await import("./lib/email/config");
      const { verifySmtpConnection } = await import("./lib/email/transporter");
      if (isSmtpConfigured()) {
        try {
          await verifySmtpConnection();
          logger.info("SMTP connection verified");
        } catch (smtpError) {
          logger.warn("SMTP verify failed at startup", {
            error: smtpError instanceof Error ? smtpError.message : String(smtpError),
          });
        }
      }
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
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
    }
  }
}

export const onRequestError = Sentry.captureRequestError;
