export const NOTIFY_ME_MESSAGES = {
  invalid: "Please enter a valid email address.",
  success: (category: string) =>
    `You're on the list! We'll email you when ${category} launches.`,
  restockSuccess: (name: string) =>
    `You're on the list! We'll email you when ${name} is back in stock.`,
  duplicate: (category: string) =>
    `You're already on the list for ${category} — we'll be in touch soon.`,
  error: "Something went wrong. Please try again.",
  earlyBird: "Get 15% early bird discount when it goes live",
  launchTitle: (category: string) => `Be first to know when ${category} launches`,
  restockTitle: (name: string) => `Notify when ${name} is back in stock`,
  restockSubtitle: "We'll email you as soon as it's available again.",
  availableSuccess: "We'll notify you when it's available!",
} as const;
