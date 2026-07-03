import { EMAIL_BRAND } from "../brand";
import { BASE_SAMPLE_DATA } from "../sample-data";
import type { EmailTemplate } from "../types";

function tpl(
  partial: Omit<EmailTemplate, "sampleData"> & { extraSample?: Record<string, string> },
): EmailTemplate {
  return {
    showTrustBadges: true,
    ...partial,
    sampleData: { ...BASE_SAMPLE_DATA, ...partial.extraSample },
  };
}

const p = (text: string) => `<p style="margin:0 0 16px;">${text}</p>`;

export const ACCOUNT_EMAIL_TEMPLATES: EmailTemplate[] = [
  tpl({
    id: "welcome",
    name: "Welcome",
    category: "account",
    subject: "Welcome to BeyondBabyCo, {{customer_name}}!",
    preheader: "Your journey to gentle, research-backed baby care starts here.",
    heading: "Welcome to the BeyondBabyCo Family",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("Thank you for joining BeyondBabyCo — where every product begins with research, safety, and love.")}${p("Explore our research-backed baby care essentials, track orders, and manage your account anytime.")}`,
    cta: { label: "Explore Products", href: "{{site_url}}/products" },
    secondaryCta: { label: "Visit Trust Center", href: "{{site_url}}/trust-center" },
  }),
  tpl({
    id: "verify-email",
    name: "Verify Email",
    category: "account",
    subject: "Verify your BeyondBabyCo email address",
    preheader: "Confirm your email to secure your account.",
    heading: "Verify Your Email",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("Please verify your email address to complete your account setup and receive order updates.")}${p("This link expires in 24 hours for your security.")}`,
    cta: { label: "Verify Email", href: "{{verify_link}}" },
  }),
  tpl({
    id: "password-reset",
    name: "Password Reset",
    category: "account",
    subject: "Reset your BeyondBabyCo password",
    preheader: "We received a request to reset your password.",
    heading: "Reset Your Password",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("We received a request to reset the password for your BeyondBabyCo account. Click below to choose a new password.")}${p("If you didn't request this, you can safely ignore this email.")}`,
    cta: { label: "Reset Password", href: "{{reset_link}}" },
    showTrustBadges: false,
  }),
  tpl({
    id: "password-changed",
    name: "Password Changed",
    category: "account",
    subject: "Your BeyondBabyCo password was changed",
    preheader: "Your account password has been updated.",
    heading: "Password Updated",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("Your BeyondBabyCo account password was successfully changed. If you made this change, no further action is needed.")}${p(`If you didn't change your password, please contact us immediately at ${EMAIL_BRAND.contact.email}.`)}`,
    cta: { label: "Contact Support", href: "{{contact_url}}" },
    showTrustBadges: false,
  }),
  tpl({
    id: "email-changed",
    name: "Email Changed",
    category: "account",
    subject: "Your BeyondBabyCo email address was updated",
    preheader: "Your account email has been changed.",
    heading: "Email Address Updated",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("The email address on your BeyondBabyCo account was changed to {{customer_email}}.")}${p("If you didn't make this change, please contact our support team immediately.")}`,
    cta: { label: "Contact Support", href: "{{contact_url}}" },
    showTrustBadges: false,
  }),
  tpl({
    id: "account-created",
    name: "Account Created",
    category: "account",
    subject: "Your BeyondBabyCo account is ready",
    preheader: "Your account has been created successfully.",
    heading: "Account Created Successfully",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("Your BeyondBabyCo account is now active. You can track orders, save addresses, and manage your wishlist from your account dashboard.")}`,
    cta: { label: "Go to My Account", href: "{{site_url}}/account" },
  }),
  tpl({
    id: "account-deleted",
    name: "Account Deleted",
    category: "account",
    subject: "Your BeyondBabyCo account has been deleted",
    preheader: "We're sorry to see you go.",
    heading: "Account Deleted",
    bodyHtml: `${p("Hi {{customer_name}},")}${p("Your BeyondBabyCo account and associated personal data have been deleted as requested.")}${p("If you change your mind, you're always welcome to create a new account. We'd love to have you back.")}`,
    cta: { label: "Visit BeyondBabyCo", href: "{{site_url}}" },
    showTrustBadges: false,
  }),
];
