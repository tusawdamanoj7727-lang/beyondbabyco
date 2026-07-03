# Auth URL configuration fix

## Problem

Supabase auth flows (email confirmation, OAuth, password reset) build redirect URLs from `NEXT_PUBLIC_APP_URL`. When the Next.js dev server binds to a different port (e.g. `3003` because `3000` is in use) but `.env.local` still says `http://localhost:3000`, users land on the wrong origin and auth fails silently or with opaque errors.

## Solution

**Single source of truth:** `NEXT_PUBLIC_APP_URL`

All auth redirect URLs derive from this variable via:

| Module | Role |
|--------|------|
| `src/lib/app-url.ts` | Runtime helpers — `getAppUrl()`, port parsing, origin matching |
| `src/lib/auth/auth-urls.ts` | Auth-specific URLs — callback, OAuth, email verify, password reset |
| `scripts/lib/app-url.mjs` | Node script helpers — same rules for `check:auth` / `check:admin` |

Hardcoded `http://localhost:3000` fallbacks were removed from auth configuration. The only exception is `NODE_ENV=test` when the variable is unset (CI unit tests).

## What uses `NEXT_PUBLIC_APP_URL`

| Flow | Implementation |
|------|----------------|
| Email verification | `emailVerificationRedirectUrl()` → `authCallbackUrl()` |
| OAuth sign-in | `oauthRedirectUrl()` → `authCallbackUrl()` |
| Password reset | `passwordResetRedirectUrl()` → `authCallbackUrl()` |
| Auth callback route | Validates request origin against `getAppUrl()` in development |
| Middleware (dev) | Redirects auth-sensitive paths with `?error=app_url_mismatch` when origin ≠ APP_URL |
| Admin login | Shows mismatch error from middleware/callback query params |
| Supabase allowlist | Printed by `npm run check:auth` |

## Port detection (`npm run check:auth`)

The check script:

1. Requires `NEXT_PUBLIC_APP_URL` in `.env.local` (no fallback).
2. Probes local ports `3000–3010` via `GET /api/health/memory`.
3. **Fails** if a dev server is running on a port that differs from `NEXT_PUBLIC_APP_URL`.
4. Prints the exact Supabase Site URL and Redirect URLs to allowlist.

```bash
npm run check:auth
```

Example failure:

```
✗ APP_URL port mismatch: NEXT_PUBLIC_APP_URL uses port 3000 but dev server is on port 3003.
  Update .env.local:
    NEXT_PUBLIC_APP_URL=http://localhost:3003
```

## Fix locally

1. Start the dev server and note the port:

   ```bash
   npm run dev
   ```

2. Set `.env.local`:

   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:<your-port>
   ```

3. Re-run validation:

   ```bash
   npm run check:auth
   ```

4. Update **Supabase Dashboard → Authentication → URL Configuration** with the URLs printed by the script (Site URL + Redirect URLs).

5. Restart the dev server so Next.js picks up the new env value.

## Runtime failure modes (development)

| Location | Behavior |
|----------|----------|
| `npm run check:auth` | Exit code 1 on port mismatch |
| `/auth/callback` | Redirect to `/login?error=app_url_mismatch` + server log |
| Middleware on `/login`, `/register`, `/admin/login`, etc. | Redirect with `app_url_mismatch` error |
| Login pages | User-facing message: update `.env.local` and run `check:auth` |

Production does not probe ports; `NEXT_PUBLIC_APP_URL` must be set to the canonical HTTPS origin.

## Files changed

- `src/lib/app-url.ts` — new shared module
- `src/lib/env.validation.ts` — `getAppUrl()` delegates to `app-url.ts`
- `src/lib/auth/auth-urls.ts` — imports from `app-url.ts`
- `src/app/auth/callback/route.ts` — origin validation
- `src/middleware/auth.ts` — dev mismatch guard
- `src/lib/auth/auth-errors.ts` — `app_url_mismatch` message
- `src/app/admin/(auth)/login/page.tsx` + `LoginForm.tsx` — display mismatch errors
- `scripts/lib/app-url.mjs` — shared script helpers
- `scripts/check-auth-config.mjs` — port detection + fail on mismatch
- `scripts/check-admin-setup.mjs` — uses `getAppUrlFromEnv()`
- `.env.example` — removed `NEXT_PUBLIC_SITE_URL` alias
- `tests/unit/app-url.test.ts` — unit coverage

## Not changed

Business logic (signup, roles, checkout, catalog, etc.) was not modified. Only auth URL configuration and redirect handling.
