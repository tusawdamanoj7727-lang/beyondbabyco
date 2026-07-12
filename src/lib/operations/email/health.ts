import "server-only";

import { isSmtpConfigured, validateSmtpEnv } from "@/lib/email/config";
import { verifySmtpConnection } from "@/lib/email/transporter";

export interface EmailHealthResult {
  provider: string | null;
  status: "ok" | "degraded" | "error";
  configured: boolean;
  detail: string;
  missingEnv: string[];
}

export async function checkEmailProviderHealth(): Promise<EmailHealthResult> {
  const validation = validateSmtpEnv();

  if (!isSmtpConfigured()) {
    return {
      provider: null,
      status: "error",
      configured: false,
      detail: validation.missing.length
        ? `Missing: ${validation.missing.join(", ")}`
        : "SMTP not configured",
      missingEnv: validation.missing,
    };
  }

  try {
    await verifySmtpConnection();
    return {
      provider: "smtp",
      status: "ok",
      configured: true,
      detail: `Hostinger SMTP (${process.env.SMTP_HOST}) verified`,
      missingEnv: [],
    };
  } catch (e) {
    return {
      provider: "smtp",
      status: "degraded",
      configured: true,
      detail: e instanceof Error ? e.message : "SMTP verify failed",
      missingEnv: [],
    };
  }
}
