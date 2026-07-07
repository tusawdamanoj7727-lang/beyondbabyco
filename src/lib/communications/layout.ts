import { EMAIL_BRAND } from "./brand";
import { htmlToPlainText, interpolate } from "./interpolate";
import type { EmailRenderOptions, EmailTemplate, RenderedEmail } from "./types";

type LayoutInput = {
  preheader: string;
  heading: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  showTrustBadges?: boolean;
  data: Record<string, string>;
  options?: EmailRenderOptions;
};

function ctaButton(label: string, href: string, primary = true): string {
  const bg = primary ? EMAIL_BRAND.colors.terra500 : "transparent";
  const color = primary ? EMAIL_BRAND.colors.white : EMAIL_BRAND.colors.green800;
  const border = primary ? "none" : `2px solid ${EMAIL_BRAND.colors.green700}`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 4px;">
  <tr>
    <td style="border-radius:999px;background:${bg};border:${border};">
      <a href="${href}" target="_blank" rel="noopener noreferrer"
         style="display:inline-block;padding:14px 28px;font-family:${EMAIL_BRAND.fonts.heading};font-size:14px;font-weight:700;color:${color};text-decoration:none;border-radius:999px;mso-padding-alt:0;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;
}

function buildTrustBadgesRow(): string {
  const badges = [
    { label: "Dermatologically Tested", emoji: "🛡️" },
    { label: "Made in India", emoji: "🇮🇳" },
    { label: "Cruelty Free", emoji: "🐰" },
  ];
  const cells = badges
    .map(
      (b) => `<td align="center" style="padding:8px 12px;font-family:${EMAIL_BRAND.fonts.body};font-size:11px;color:${EMAIL_BRAND.colors.textMuted};">
        <span style="font-size:18px;line-height:1;display:block;margin-bottom:4px;" aria-hidden="true">${b.emoji}</span>
        ${b.label}
      </td>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
    <tr>${cells}</tr>
  </table>`;
}

/** Shared premium email layout — table-based, mobile-first, dark-mode aware. */
export function renderEmailLayout(input: LayoutInput): string {
  const { colors, fonts, logo, contact, social, legal } = EMAIL_BRAND;
  const preheader = interpolate(input.preheader, input.data);
  const heading = interpolate(input.heading, input.data);
  const bodyHtml = interpolate(input.bodyHtml, input.data);
  const cta = input.cta
    ? { label: interpolate(input.cta.label, input.data), href: interpolate(input.cta.href, input.data) }
    : undefined;
  const secondaryCta = input.secondaryCta
    ? {
        label: interpolate(input.secondaryCta.label, input.data),
        href: interpolate(input.secondaryCta.href, input.data),
      }
    : undefined;

  const ctaHtml = [cta ? ctaButton(cta.label, cta.href) : "", secondaryCta ? ctaButton(secondaryCta.label, secondaryCta.href, false) : ""]
    .filter(Boolean)
    .join("");

  const trustHtml = input.showTrustBadges !== false ? buildTrustBadgesRow() : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${heading}</title>
  <!--[if mso]><style>table{border-collapse:collapse;}td{font-family:Arial,sans-serif;}</style><![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-padding { padding: 24px 20px !important; }
      .email-heading { font-size: 24px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: ${colors.darkBg} !important; }
      .email-card { background-color: ${colors.darkCard} !important; border-color: #2d4a35 !important; }
      .email-heading { color: ${colors.darkText} !important; }
      .email-body { color: ${colors.darkMuted} !important; }
      .email-footer { color: ${colors.darkMuted} !important; }
      .email-footer a { color: #7ec99a !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${colors.cream50};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;" class="email-bg">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.cream50};" class="email-bg">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <a href="${interpolate("{{site_url}}", input.data)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                <img src="${logo.url}" alt="${logo.alt}" width="${logo.width}" height="${logo.height}" style="display:block;max-width:160px;height:auto;border:0;" />
              </a>
            </td>
          </tr>
          <!-- Glass-inspired card -->
          <tr>
            <td class="email-card email-padding" style="background-color:${colors.white};border:1px solid ${colors.border};border-radius:24px;padding:40px 36px;box-shadow:0 4px 24px rgba(29,69,45,0.08);">
              <h1 class="email-heading" style="margin:0 0 16px;font-family:${fonts.heading};font-size:28px;font-weight:800;line-height:1.2;color:${colors.textPrimary};">${heading}</h1>
              <div class="email-body" style="font-family:${fonts.body};font-size:16px;line-height:1.75;color:${colors.textSecondary};">
                ${bodyHtml}
              </div>
              ${ctaHtml ? `<div style="margin-top:28px;text-align:center;">${ctaHtml}</div>` : ""}
              ${trustHtml}
            </td>
          </tr>
          <!-- Support -->
          <tr>
            <td style="padding:28px 16px 16px;text-align:center;font-family:${fonts.body};font-size:13px;line-height:1.6;color:${colors.textMuted};" class="email-footer">
              <p style="margin:0 0 8px;font-weight:600;color:${colors.textPrimary};">Need help?</p>
              <p style="margin:0 0 4px;">
                <a href="mailto:${contact.email}" style="color:${colors.terra600};text-decoration:none;">${contact.email}</a>
              </p>
              <p style="margin:0 0 12px;">${contact.supportHours}</p>
              <p style="margin:0 0 16px;">
                <a href="${social.instagram}" target="_blank" rel="noopener noreferrer" style="color:${colors.terra600};text-decoration:none;font-weight:600;">Follow @beyoundbabyco</a>
              </p>
            </td>
          </tr>
          <!-- Legal footer -->
          <tr>
            <td style="padding:0 16px 32px;text-align:center;font-family:${fonts.body};font-size:11px;line-height:1.6;color:${colors.textMuted};" class="email-footer">
              <p style="margin:0 0 8px;">${contact.company} · ${contact.address}</p>
              <p style="margin:0 0 8px;">
                <a href="${legal.privacyUrl}" style="color:${colors.textMuted};text-decoration:underline;">Privacy</a>
                &nbsp;·&nbsp;
                <a href="${legal.termsUrl}" style="color:${colors.textMuted};text-decoration:underline;">Terms</a>
              </p>
              <p style="margin:0;color:${colors.textMuted};">© ${new Date().getFullYear()} BeyondBabyCo. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderEmailTemplate(
  template: EmailTemplate,
  data: Record<string, string>,
  options?: EmailRenderOptions,
): RenderedEmail {
  const merged = { ...template.sampleData, ...data };
  const html = renderEmailLayout({
    preheader: template.preheader,
    heading: template.heading,
    bodyHtml: template.bodyHtml,
    cta: template.cta,
    secondaryCta: template.secondaryCta,
    showTrustBadges: template.showTrustBadges,
    data: merged,
    options,
  });
  return {
    subject: interpolate(template.subject, merged),
    preheader: interpolate(template.preheader, merged),
    html,
    text: htmlToPlainText(interpolate(template.bodyHtml, merged)),
  };
}
