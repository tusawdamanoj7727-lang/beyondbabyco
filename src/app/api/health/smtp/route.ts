import nodemailer from "nodemailer";

import { jsonError, jsonOk } from "@/lib/api/route-helpers";
import { getSmtpConfig } from "@/lib/email/config";
import { getTransporter } from "@/lib/email/transporter";
import { isHealthCheckAuthorized } from "@/lib/security/health-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Temporary observational probe — no password values returned. */
const DIAG_ENV_KEYS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
  "EMAIL_REPLY_TO",
  "EMAIL_MAX_RETRIES",
  "EMAIL_RETRY_DELAY_MS",
  "ADMIN_ALERT_EMAIL",
] as const;

function present(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function extractMailbox(from: string | undefined): string | null {
  if (!from?.trim()) return null;
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] ?? from).trim().toLowerCase();
}

function serializeError(err: unknown): Record<string, unknown> {
  if (!err || typeof err !== "object") {
    return { value: String(err) };
  }
  const out: Record<string, unknown> = {};
  for (const key of Object.getOwnPropertyNames(err)) {
    try {
      out[key] = (err as Record<string, unknown>)[key];
    } catch {
      out[key] = "[unreadable]";
    }
  }
  for (const key of [
    "code",
    "command",
    "response",
    "responseCode",
    "errno",
    "syscall",
    "address",
    "port",
    "hostname",
    "source",
  ] as const) {
    if (key in err && !(key in out)) {
      out[key] = (err as Record<string, unknown>)[key];
    }
  }
  out.string = String(err);
  return out;
}

function authorize(request: Request): boolean {
  if (isHealthCheckAuthorized(request)) return true;
  const diag = process.env.SMTP_DIAG_TOKEN?.trim();
  if (!diag) return false;
  // Bearer only — never accept query-string tokens (logs / referrers).
  const auth = request.headers.get("authorization")?.trim() ?? "";
  return auth === `Bearer ${diag}`;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return jsonError("Unauthorized", 401);
  }

  const raw = Object.fromEntries(
    DIAG_ENV_KEYS.map((key) => [key, process.env[key] ?? null]),
  );

  const mailStarKeys = Object.keys(process.env)
    .filter((key) => key.startsWith("MAIL_"))
    .sort();

  const host = process.env.SMTP_HOST?.trim() ?? null;
  const portRaw = process.env.SMTP_PORT;
  const secureRaw = process.env.SMTP_SECURE;
  const user = process.env.SMTP_USER?.trim() ?? null;
  const from = process.env.EMAIL_FROM?.trim() ?? null;
  const port = Number(portRaw ?? 465);
  const secure = secureRaw === "true" || port === 465;
  const fromMailbox = extractMailbox(from ?? undefined);
  const userLower = user?.toLowerCase() ?? null;
  const config = getSmtpConfig();

  const runtimeConfig = {
    envKeysReadBySendEmail: [...DIAG_ENV_KEYS],
    SMTP_USER_defined: present(process.env.SMTP_USER),
    SMTP_PASS_defined: present(process.env.SMTP_PASS),
    SMTP_PASS_length: present(process.env.SMTP_PASS)
      ? process.env.SMTP_PASS!.trim().length
      : 0,
    SMTP_HOST: host,
    SMTP_PORT: portRaw ?? null,
    SMTP_SECURE: secureRaw ?? null,
    EMAIL_FROM: from,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO?.trim() ?? null,
    ADMIN_ALERT_EMAIL: process.env.ADMIN_ALERT_EMAIL?.trim() ?? null,
    resolved: {
      port,
      secure,
      getSmtpConfig_ok: config !== null,
      authUser: config?.user ?? user,
      from: config?.from ?? from,
    },
    userMatchesFromMailbox: Boolean(userLower && fromMailbox && userLower === fromMailbox),
    smtpUser: user,
    fromMailbox,
    mailStarKeysPresent: mailStarKeys,
    mailStarFallbackUsed: false,
    transporterModuleCache: "singleton getTransporter() — credentials fixed on first create in this isolate",
    deployment: {
      VERCEL_ENV: process.env.VERCEL_ENV ?? null,
      VERCEL_URL: process.env.VERCEL_URL ?? null,
      VERCEL_DEPLOYMENT_ID: process.env.VERCEL_DEPLOYMENT_ID ?? null,
      VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    },
  };

  const verifyFresh: {
    ok: boolean;
    error: Record<string, unknown> | null;
  } = { ok: false, error: null };
  const verifyCached: {
    ok: boolean;
    error: Record<string, unknown> | null;
    skipped?: string;
  } = { ok: false, error: null };

  if (host && user && present(process.env.SMTP_PASS) && from) {
    const fresh = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass: process.env.SMTP_PASS!.trim() },
      connectionTimeout: 20_000,
      greetingTimeout: 20_000,
      socketTimeout: 25_000,
    });
    try {
      await fresh.verify();
      verifyFresh.ok = true;
    } catch (err) {
      verifyFresh.error = serializeError(err);
    }

    try {
      await getTransporter().verify();
      verifyCached.ok = true;
    } catch (err) {
      verifyCached.error = serializeError(err);
    }
  } else {
    verifyFresh.error = {
      reason: "missing_required_env",
      missing: [
        !host && "SMTP_HOST",
        !user && "SMTP_USER",
        !present(process.env.SMTP_PASS) && "SMTP_PASS",
        !from && "EMAIL_FROM",
      ].filter(Boolean),
    };
    verifyCached.skipped = "getSmtpConfig would return null — cached transporter not created";
  }

  return jsonOk({
    probe: "smtp-runtime",
    timestamp: new Date().toISOString(),
    runtimeConfig,
    /** Intentionally omit raw password / full raw map values for PASS */
    envPresence: Object.fromEntries(
      DIAG_ENV_KEYS.map((key) => [
        key,
        {
          defined: present(process.env[key]),
          length: present(process.env[key]) ? process.env[key]!.trim().length : 0,
          value:
            key === "SMTP_PASS" || key === "SMTP_USER"
              ? null
              : present(process.env[key])
                ? process.env[key]!.trim()
                : process.env[key] === ""
                  ? ""
                  : null,
        },
      ]),
    ),
    verifyFreshTransporter: verifyFresh,
    verifyCachedTransporter: verifyCached,
    note: "Observational only. sendEmail uses getTransporter() singleton after getSmtpConfig().",
  });
}
