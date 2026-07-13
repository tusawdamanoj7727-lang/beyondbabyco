# BeyondBabyCo — Playwright E2E Tests

End-to-end coverage for the public storefront: catalog, cart, auth, checkout, payments, inventory, account, mobile, and accessibility smoke checks.

## Run

```bash
# Production (customer creds from tests/e2e/production.env)
npx playwright test --config=playwright.production.config.ts

# Open HTML report after a run
npm run test:e2e:report
```

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `PLAYWRIGHT_BASE_URL` | No | Target URL (default: production config uses `https://beyondbabyco.in`) |
| `E2E_CUSTOMER_EMAIL` | For checkout/account/COD/Razorpay | Loaded from `tests/e2e/production.env` in production config |
| `E2E_CUSTOMER_PASSWORD` | For checkout/account/COD/Razorpay | Loaded from `tests/e2e/production.env` in production config |
| `E2E_ADMIN_EMAIL` | For admin specs only | Not used in production config (admin tests skip) |

Tests that need a signed-in customer **skip gracefully** when `E2E_CUSTOMER_*` is unset.

## Reports & artifacts

- **HTML report:** `playwright-report/` (generated every run)
- **Screenshots:** captured on failure (`screenshot: only-on-failure`)
- **Videos:** retained on failure
- **Traces:** on first retry (CI)

## Suite layout

| Spec | Coverage |
|------|----------|
| `homepage.spec.ts` | Homepage load + a11y |
| `navigation.spec.ts` | Nav links, cart, mobile menu |
| `search.spec.ts` | Catalog + search page |
| `product.spec.ts` | PDP, quantity, inventory API |
| `cart.spec.ts` | Add, remove, quantity, mini cart |
| `coupon.spec.ts` | Apply/remove coupon |
| `auth.spec.ts` | Login, register, password reset |
| `checkout.spec.ts` | Checkout form, review, COD success |
| `payment.spec.ts` | Razorpay mock, failure pages |
| `inventory.spec.ts` | Stock API + reservation after order |
| `account.spec.ts` | Account hub + sub-pages |
| `mobile.spec.ts` | Mobile viewport flows + a11y |
| `accessibility.spec.ts` | Cross-page a11y smoke |
| `smoke.spec.ts` | Legacy smoke + health |
| `admin-modules.spec.ts` | Admin (credentials required) |

## Razorpay

Online payment tests mock `checkout.razorpay.com/v1/checkout.js` and `/api/verify-payment` — no real charges. Tests skip when Razorpay is disabled in the environment.

## Helpers

Shared utilities live in `tests/e2e/helpers/` (`cart`, `auth`, `checkout`, `razorpay.mock`, `a11y`, `inventory`).
