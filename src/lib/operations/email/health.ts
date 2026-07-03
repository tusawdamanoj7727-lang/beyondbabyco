import "server-only";

import { getEmailProviderId, validateEmailProviderEnv } from "./config";

export interface EmailHealthResult {
  provider: string | null;
  status: "ok" | "degraded" | "error";
  configured: boolean;
  detail: string;
  missingEnv: string[];
}

export async function checkEmailProviderHealth(): Promise<EmailHealthResult> {
  const provider = getEmailProviderId();
  const validation = validateEmailProviderEnv();

  if (!provider) {
    return {
      provider: null,
      status: "error",
      configured: false,
      detail: "EMAIL_PROVIDER not set",
      missingEnv: ["EMAIL_PROVIDER"],
    };
  }

  if (!validation.valid) {
    return {
      provider,
      status: "error",
      configured: false,
      detail: `Missing: ${validation.missing.join(", ")}`,
      missingEnv: validation.missing,
    };
  }

  // Lightweight connectivity probe for Resend
  if (provider === "resend") {
    const key = process.env.RESEND_API_KEY?.trim();
    try {
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (res.ok || res.status === 403) {
        return { provider, status: "ok", configured: true, detail: "Resend API reachable", missingEnv: [] };
      }
      return { provider, status: "degraded", configured: true, detail: `Resend HTTP ${res.status}`, missingEnv: [] };
    } catch (e) {
      return {
        provider,
        status: "degraded",
        configured: true,
        detail: e instanceof Error ? e.message : "Resend unreachable",
        missingEnv: [],
      };
    }
  }

  // SMTP/SES — TCP connect check
  if (provider === "smtp" || provider === "ses") {
    const host =
      provider === "ses"
        ? process.env.AWS_SES_SMTP_HOST?.trim() ||
          `email-smtp.${process.env.AWS_SES_REGION?.trim() ?? "us-east-1"}.amazonaws.com`
        : process.env.SMTP_HOST?.trim();
    const port = Number(
      provider === "ses" ? (process.env.AWS_SES_SMTP_PORT ?? 587) : (process.env.SMTP_PORT ?? 587),
    );

    if (!host) {
      return { provider, status: "error", configured: false, detail: "SMTP host missing", missingEnv: ["SMTP_HOST"] };
    }

    try {
      const net = await import("node:net");
      const ok = await new Promise<boolean>((resolve) => {
        const socket = net.connect({ host, port, timeout: 5_000 });
        socket.on("connect", () => {
          socket.destroy();
          resolve(true);
        });
        socket.on("error", () => resolve(false));
        socket.on("timeout", () => {
          socket.destroy();
          resolve(false);
        });
      });
      return {
        provider,
        status: ok ? "ok" : "degraded",
        configured: true,
        detail: ok ? `${host}:${port} reachable` : `${host}:${port} unreachable`,
        missingEnv: [],
      };
    } catch {
      return { provider, status: "degraded", configured: true, detail: "SMTP probe skipped", missingEnv: [] };
    }
  }

  // SendGrid — API key format check
  if (provider === "sendgrid") {
    const key = process.env.SENDGRID_API_KEY?.trim();
    const validFormat = Boolean(key && key.startsWith("SG."));
    return {
      provider,
      status: validFormat ? "ok" : "degraded",
      configured: true,
      detail: validFormat ? "SendGrid API key present" : "SendGrid API key format unexpected",
      missingEnv: [],
    };
  }

  return { provider, status: "ok", configured: true, detail: `Provider ${provider} configured`, missingEnv: [] };
}
