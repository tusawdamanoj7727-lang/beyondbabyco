import "server-only";

import nodemailer from "nodemailer";

import { getSmtpConfig } from "./config";

let transporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter {
  const config = getSmtpConfig();
  if (!config) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM.",
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
    });
  }

  return transporter;
}

export async function verifySmtpConnection(): Promise<void> {
  if (!getSmtpConfig()) return;
  await getTransporter().verify();
}
