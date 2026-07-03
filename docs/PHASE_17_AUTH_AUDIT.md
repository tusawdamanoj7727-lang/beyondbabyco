# Phase 17 — Authentication System Audit & Repair

Full audit and repair of the Next.js + Supabase authentication stack. **No UI redesign** — logic, callbacks, errors, and configuration only.

---

## Root cause(s)

| Issue | Root cause |
|-------|------------|
| Email/OAuth confirmation completes but user not signed in | **`/auth/callback` replaced the `NextResponse` after `exchangeCodeForSession`**, dropping session cookies set during PKCE exchange |
| Email confirmation link ineffective | Same cookie bug + missing **`verifyOtp({ token_hash, type })`** path for legacy/email template links |
| OAuth (Google/Apple/Facebook) does not complete | Redirect URL / Site URL mismatch in Supabase Dashboard; callback cookie bug; providers must be enabled in Supabase |
| Generic "Invalid email/password" | All Supabase auth errors mapped to one message — **unconfirmed email** and rate limits indistinguishable from wrong password |
| Admin login appears to fail after valid password | Role RPC failure treated like bad credentials; now surfaces **"Role verification failed"** separately |
| Dev on port 3003 fails auth | `NEXT_PUBLIC_APP_URL` defaults to `localhost:3000` — email/OAuth redirects hit wrong port |
| Profile missing after signup/OAuth | `SUPABASE_SERVICE_ROLE_KEY` required for `ensureCustomerRecordsForUser()` — verified present locally |

---

## Files changed

| File | Change |
|------|--------|
| `src/app/auth/callback/route.ts` | **Critical fix:** single redirect response for cookie persistence; `verifyOtp` for `token_hash`; granular error codes |
| `src/lib/auth/auth-errors.ts` | **New** — `mapSupabaseAuthError()`, callback error messages |
| `src/lib/auth/auth-urls.ts` | Normalized base URL; `supabaseRedirectAllowlist()` helper |
| `src/lib/auth/auth.ts` | Accurate admin sign-in errors; RPC failure handling before role gate |
| `src/lib/auth/customer-auth-actions.ts` | Accurate customer sign-in/sign-up/OAuth/reset errors |
| `src/app/(storefront)/(auth)/login/page.tsx` | Expanded callback error mapping |
| `scripts/check-auth-config.mjs` | **New** — validates env + prints Supabase redirect allowlist |
| `tests/unit/auth-errors.test.ts` | **New** — unit tests for error mapping |
| `package.json` | Added `check:auth` script |
| `.env.example` | Documented Supabase URL configuration requirements |

---

## Database changes

**None.** Existing schema retained:

- `profiles` — app-managed via service role (`customer-bootstrap.ts`, `bootstrap-admin.mjs`)
- `roles`, `permissions`, `role_permissions` — seeded by bootstrap
- `current_user_role()`, `current_user_permissions()`, `log_activity()` — `SECURITY DEFINER` unchanged (`006_auth_functions.sql`)

No RLS weakening. No migration required for this repair.

---

## Environment variables checked

| Variable | Status (local) |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Configured |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Configured |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Configured |
| `NEXT_PUBLIC_APP_URL` | ⚠️ `http://localhost:3000` — update if dev runs on another port |

Run:

```bash
npm run check:auth
npm run check:admin
```

---

## Supabase Dashboard configuration (required)

### URL Configuration

- **Site URL:** `{NEXT_PUBLIC_APP_URL}` (e.g. `http://localhost:3000`)
- **Redirect URLs:**
  - `{APP_URL}/auth/callback`
  - `{APP_URL}/auth/callback?*`

### Email templates

Confirm links must redirect to `/auth/callback` with PKCE `code` or `token_hash` + `type`.

App sets:

- Signup: `{APP_URL}/auth/callback?type=signup&next=/account?verified=1`
- Recovery: `{APP_URL}/auth/callback?type=recovery&next=/reset-password`
- OAuth: `{APP_URL}/auth/callback?next=/account`

### OAuth providers

Enable in **Authentication → Providers** and configure:

| Provider | Supabase callback |
|----------|-------------------|
| Google | `{SUPABASE_URL}/auth/v1/callback` |
| Apple | Same |
| Facebook | Same |

App `redirectTo` must be allowlisted as above.

---

## Fixes by flow

### Email signup & confirmation

1. `signUp()` with `emailRedirectTo` — unchanged
2. User clicks email → `/auth/callback`
3. **`exchangeCodeForSession(code)`** or **`verifyOtp({ token_hash, type })`**
4. Session cookies written to **same** response object
5. Redirect → `/account?verified=1`
6. Profile bootstrap via service role

### Email login

- `signInWithPassword()` with **`mapSupabaseAuthError()`**
- Unconfirmed email → *"Please confirm your email before signing in..."*

### OAuth

- `signInWithOAuth()` → provider → Supabase → `/auth/callback?code=...`
- Session exchange + cookie fix → redirect to `next`

### Admin login

- Password auth → **`current_user_role()` RPC**
- RPC error → *"Role verification failed..."* (not bad password)
- Missing admin profile → *"Run npm run bootstrap:admin..."*
- Non-staff role → *"This account does not have admin access."*

Credentials (bootstrap): `admin@beyondbabyco.com` / `Admin@123456`

---

## Middleware

- `/auth/callback` is **not** an admin route — not blocked
- Session refresh runs on all matched routes via `updateSessionAndGuard()`
- CSRF applies to `/api/*` only — not auth callbacks

---

## Validation results

| Check | Result |
|-------|--------|
| `npm run lint` | ✅ 0 errors |
| `npm run typecheck` | ✅ Pass |
| `npm test` | ✅ 122 / 122 passed (+4 auth error tests) |
| `npm run build` | ✅ (see CI/build output) |
| `npm run check:auth` | ✅ Pass (port 3000 warning if using 3003) |
| `npm run check:admin` | ✅ Pass — admin user + RPC verified |

### Manual checklist (requires Supabase Dashboard + browser)

| Flow | App-side | Dashboard required |
|------|----------|-------------------|
| Email signup | ✅ Fixed | Confirm email enabled |
| Confirmation link | ✅ Fixed | Redirect URLs allowlisted |
| Email login | ✅ Fixed | — |
| Google login | ✅ Fixed | Provider enabled + OAuth credentials |
| Apple login | ✅ Fixed | Provider enabled + Apple Service ID |
| Facebook login | ✅ Fixed | Provider enabled + App ID/Secret |
| Admin login | ✅ Fixed | `bootstrap:admin` run |
| Session persistence | ✅ Fixed | Cookie bug resolved |
| Password reset | ✅ Fixed | Recovery redirect allowlisted |

---

## Next steps for you

1. **Update `.env.local`** if dev runs on port **3003**:
   ```
   NEXT_PUBLIC_APP_URL=http://localhost:3003
   NEXT_PUBLIC_SITE_URL=http://localhost:3003
   ```
2. **Supabase Dashboard** → paste redirect URLs from `npm run check:auth`
3. **Enable OAuth providers** with credentials from Google/Apple/Facebook developer consoles
4. Restart dev server and test each flow

No UI changes were made in this phase.
