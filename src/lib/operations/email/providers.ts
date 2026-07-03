import "server-only";

import type { EmailPayload } from "@/lib/communications/types";
import { logger } from "@/lib/observability/logger";

import { getEmailProviderConfig } from "./config";

export type EmailSendResult = { id: string; ok: boolean; error?: string };

async function sendViaResend(payload: EmailPayload, apiKey: string): Promise<EmailSendResult> {
  const config = getEmailProviderConfig();
  const from = payload.from ?? (config.fromName ? `${config.fromName} <${config.fromEmail}>` : config.fromEmail!);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      reply_to: payload.replyTo ?? config.replyTo ?? undefined,
      tags: payload.tags?.map((name) => ({ name, value: "true" })),
    }),
  });

  const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) {
    return { id: "resend-error", ok: false, error: body.message ?? `Resend HTTP ${res.status}` };
  }
  return { id: body.id ?? "resend-sent", ok: true };
}

async function sendViaSendGrid(payload: EmailPayload, apiKey: string): Promise<EmailSendResult> {
  const config = getEmailProviderConfig();
  const fromEmail = payload.from ?? config.fromEmail!;

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: payload.to }] }],
      from: { email: fromEmail, name: config.fromName ?? undefined },
      reply_to: payload.replyTo ?? config.replyTo ? { email: payload.replyTo ?? config.replyTo! } : undefined,
      subject: payload.subject,
      content: [
        ...(payload.text ? [{ type: "text/plain", value: payload.text }] : []),
        { type: "text/html", value: payload.html },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { id: "sendgrid-error", ok: false, error: text || `SendGrid HTTP ${res.status}` };
  }
  const messageId = res.headers.get("x-message-id") ?? "sendgrid-sent";
  return { id: messageId, ok: true };
}

async function sendViaSes(payload: EmailPayload): Promise<EmailSendResult> {
  const region = process.env.AWS_SES_REGION?.trim();
  const accessKey = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const config = getEmailProviderConfig();

  if (!region || !accessKey || !secretKey || !config.fromEmail) {
    return { id: "ses-not-configured", ok: false, error: "AWS SES credentials incomplete" };
  }

  // SES SMTP relay — avoids AWS SigV4 SDK dependency
  const smtpHost = process.env.AWS_SES_SMTP_HOST?.trim() || `email-smtp.${region}.amazonaws.com`;
  const smtpUser = process.env.AWS_SES_SMTP_USER?.trim() || accessKey;
  const smtpPass = process.env.AWS_SES_SMTP_PASS?.trim() || secretKey;
  const smtpPort = Number(process.env.AWS_SES_SMTP_PORT ?? 587);

  return sendViaSmtp(payload, { host: smtpHost, port: smtpPort, user: smtpUser, pass: smtpPass, secure: smtpPort === 465 });
}

async function sendViaSmtp(
  payload: EmailPayload,
  opts?: { host?: string; port?: number; user?: string; pass?: string; secure?: boolean },
): Promise<EmailSendResult> {
  const host = opts?.host ?? process.env.SMTP_HOST?.trim();
  const port = opts?.port ?? Number(process.env.SMTP_PORT ?? 587);
  const user = opts?.user ?? process.env.SMTP_USER?.trim();
  const pass = opts?.pass ?? process.env.SMTP_PASS?.trim();
  const config = getEmailProviderConfig();
  const fromEmail = payload.from ?? config.fromEmail;

  if (!host || !fromEmail) {
    return { id: "smtp-not-configured", ok: false, error: "SMTP host or from address missing" };
  }

  const tls = await import("node:tls");
  const net = await import("node:net");

  const secure = opts?.secure ?? (process.env.SMTP_SECURE === "true" || port === 465);

  return new Promise((resolve) => {
    let buffer = "";
    let step = 0;
    const commands: string[] = [`EHLO beyondbabyco\r\n`];

    if (user && pass) {
      const auth = Buffer.from(`\0${user}\0${pass}`).toString("base64");
      commands.push(`AUTH PLAIN ${auth}\r\n`);
    }
    commands.push(`MAIL FROM:<${fromEmail}>\r\n`);
    commands.push(`RCPT TO:<${payload.to}>\r\n`);
    commands.push(`DATA\r\n`);
    commands.push(
      `From: ${config.fromName ? `${config.fromName} <${fromEmail}>` : fromEmail}\r\n` +
        `To: ${payload.to}\r\n` +
        `Subject: ${payload.subject}\r\n` +
        `MIME-Version: 1.0\r\n` +
        `Content-Type: text/html; charset=utf-8\r\n\r\n` +
        `${payload.html}\r\n.\r\n`,
    );
    commands.push(`QUIT\r\n`);

    const socket = secure
      ? tls.connect({ host, port, servername: host })
      : net.connect({ host, port });

    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({ id: "smtp-timeout", ok: false, error: "SMTP connection timed out" });
    }, 15_000);

    socket.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\r\n");
      const lastComplete = lines.length > 1 ? lines[lines.length - 2] : "";
      const code = parseInt(lastComplete.slice(0, 3), 10);

      if (Number.isNaN(code)) return;

      if (step === 0 && code === 220) {
        socket.write(commands[step++]);
        return;
      }

      if (code >= 400) {
        clearTimeout(timeout);
        socket.destroy();
        resolve({ id: "smtp-error", ok: false, error: lastComplete });
        return;
      }

      if (step < commands.length && (code === 250 || code === 235 || code === 334 || code === 354)) {
        if (step === 1 && !user) step++;
        socket.write(commands[step++]);
        if (step >= commands.length) {
          clearTimeout(timeout);
          socket.end();
          resolve({ id: `smtp-${Date.now()}`, ok: true });
        }
      }
    });

    socket.on("error", (err) => {
      clearTimeout(timeout);
      resolve({ id: "smtp-error", ok: false, error: err.message });
    });
  });
}

export async function sendWithProvider(payload: EmailPayload): Promise<EmailSendResult> {
  const config = getEmailProviderConfig();
  if (!config.provider) {
    return { id: "no-provider", ok: false, error: "EMAIL_PROVIDER not configured" };
  }

  logger.info("email.send.attempt", { provider: config.provider, to: payload.to });

  switch (config.provider) {
    case "resend": {
      const key = process.env.RESEND_API_KEY?.trim();
      if (!key) return { id: "resend-not-configured", ok: false, error: "RESEND_API_KEY missing" };
      return sendViaResend(payload, key);
    }
    case "sendgrid": {
      const key = process.env.SENDGRID_API_KEY?.trim();
      if (!key) return { id: "sendgrid-not-configured", ok: false, error: "SENDGRID_API_KEY missing" };
      return sendViaSendGrid(payload, key);
    }
    case "ses":
      return sendViaSes(payload);
    case "smtp":
      return sendViaSmtp(payload);
    default:
      return { id: "unknown-provider", ok: false, error: "Unknown email provider" };
  }
}
