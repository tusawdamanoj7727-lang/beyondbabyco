import { expect, type Page } from "@playwright/test";

export type A11ySmokeOptions = {
  /** Auth shells omit the global navbar. */
  requireNav?: boolean;
  /** Empty cart uses h2; most pages use h1. */
  headingLevel?: "h1" | "any";
};

export async function assertAccessibilitySmoke(
  page: Page,
  context: string,
  options: A11ySmokeOptions = {},
): Promise<void> {
  const { requireNav = true, headingLevel = "h1" } = options;

  await expect(page, `${context}: document title`).toHaveTitle(/.+/);

  const main = page.locator('main, [role="main"]').first();
  await expect(main, `${context}: main landmark`).toBeVisible();

  if (headingLevel === "h1") {
    await expect(page.locator("h1").first(), `${context}: primary heading`).toBeVisible();
  } else {
    await expect(page.getByRole("heading").first(), `${context}: page heading`).toBeVisible();
  }

  if (requireNav) {
    const nav = page.getByRole("navigation").first();
    await expect(nav, `${context}: site navigation`).toBeVisible();
  }

  const imagesMissingAlt = await page.locator("img:not([alt])").count();
  expect(imagesMissingAlt, `${context}: images without alt attribute`).toBe(0);

  const skipLinkOrLogo = page.getByRole("link", { name: /BeyondBabyCo home|Skip to/i });
  await expect(skipLinkOrLogo.first(), `${context}: home or skip link`).toBeVisible();
}
