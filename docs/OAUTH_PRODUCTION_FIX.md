# Google OAuth Production Fix — Root Cause Report

**Date:** 2026-07-04  
**Symptom:** After Google sign-in on `https://beyondbabyco.in`, browser redirects to  
`http://localhost:3000/auth/callback?code=...` instead of  
`https://beyondbabyco.in/auth/callback?code=...`

---

## 1. Root cause

**Vercel production was built/run with `NEXT_PUBLIC_APP_URL=http://localhost:3000`** (copied from local `.env.local`). That value was passed to Supabase as the OAuth `redirectTo` URL.

Supabase honors the `redirectTo` parameter from `signInWithOAuth()`. Google completes auth → Supabase redirects to whatever URL the app sent → **localhost** on the user's machine → failure.

---

## 2. Exact file & line (before fix)

| Step | File | Line | What happens |
|------|------|------|--------------|
| 1 | `src/components/auth/OAuthButtons.tsx` | ~48 | Calls `customerOAuthAction()` |
| 2 | `src/lib/auth/customer-auth-actions.ts` | **264** | `redirectTo: oauthRedirectUrl(next)` |
| 3 | `src/lib/auth/auth-urls.ts` | **39–40** | `oauthRedirectUrl()` → `authCallbackUrl()` |
| 4 | `src/lib/auth/auth-urls.ts` | **10** | `new URL("/auth/callback", getAuthBaseUrl())` |
| 5 | `src/lib/app-url.ts` | **15–17** | `getAppUrl()` → `process.env.NEXT_PUBLIC_APP_URL` |
| 6 | **Result** | — | `http://localhost:3000/auth/callback?next=/account` |

---

## 3. Why localhost was generated

1. `NEXT_PUBLIC_APP_URL` was set to `http://localhost:3000` in **Vercel Production** environment variables (or baked in at build from that value).
2. Auth redirect helpers read **only** that env var — they did **not** use the live request host (`beyondbabyco.in`).
3. No production fallback existed when env pointed at localhost.

---

## 4. Code before

```typescript
// src/lib/app-url.ts
export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return normalizeAppUrl(configured);
  if (process.env.NODE_ENV === "test") return "http://localhost:3000";
  throw new Error("NEXT_PUBLIC_APP_URL is required...");
}

// src/lib/auth/customer-auth-actions.ts
redirectTo: oauthRedirectUrl(next),
// → http://localhost:3000/auth/callback when env is wrong
```

---

## 5. Code after

### A. Request-origin auth URLs (primary fix)

Server actions now derive the OAuth callback base from the **incoming request host**:

```typescript
// src/lib/app-url.server.ts (new)
export async function getAuthBaseUrlForRequest(): Promise<string> {
  const origin = await getRequestOrigin(); // https://beyondbabyco.in from headers
  if (origin) return origin;
  return getAppUrl();
}

// src/lib/auth/customer-auth-actions.ts
const authBaseUrl = await getAuthBaseUrlForRequest();
redirectTo: oauthRedirectUrl(next, authBaseUrl),
// → https://beyondbabyco.in/auth/callback?next=/account
```

### B. Production-safe `getAppUrl()` fallbacks

```typescript
// src/lib/app-url.ts
// 1. NEXT_PUBLIC_APP_URL / APP_URL (ignored if localhost in production)
// 2. https://{VERCEL_URL}
// 3. https://beyondbabyco.in
// 4. http://localhost:3000 (development)
```

---

## 6. Required Vercel env changes

In **Vercel → Project → Settings → Environment Variables → Production**:

| Variable | Value | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_APP_URL` | `https://beyondbabyco.in` | **Yes** |
| `NEXT_PUBLIC_SUPABASE_URL` | *(your Supabase URL)* | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(anon key)* | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | *(service role)* | Yes |

**Remove or overwrite** any Production value of `NEXT_PUBLIC_APP_URL=http://localhost:3000`.

Apply to **Production** (and Preview if using custom preview domains).

---

## 7. Required Supabase changes

**Authentication → URL Configuration:**

| Field | Value |
|-------|-------|
| **Site URL** | `https://beyondbabyco.in` |
| **Redirect URLs** | `https://beyondbabyco.in/auth/callback` |
| | `https://beyondbabyco.in/auth/callback?*` |

Also allowlist (if using email auth):

- `https://beyondbabyco.in/auth/callback?type=signup&next=/account?verified=1`
- `https://beyondbabyco.in/auth/callback?type=recovery&next=/reset-password`

**Authentication → Providers → Google:** ensure Google OAuth is enabled.

Run locally after deploy:

```bash
npm run check:auth
```

---

## 8. Redeploy required?

**Yes.** Required because:

1. Code fix must be deployed (`getAuthBaseUrlForRequest`).
2. `NEXT_PUBLIC_*` variables are inlined at **build time** — changing Vercel env without redeploying leaves stale values in client bundles.

**Steps:**

1. Set `NEXT_PUBLIC_APP_URL=https://beyondbabyco.in` on Vercel Production.
2. Update Supabase redirect URLs (section 7).
3. Push/deploy this fix to `main`.
4. Trigger a **new production deployment**.
5. Test: `https://beyondbabyco.in/login` → Continue with Google → should return to `https://beyondbabyco.in/auth/callback`.

---

## 9. Verification checklist

- [ ] Vercel Production env: `NEXT_PUBLIC_APP_URL=https://beyondbabyco.in`
- [ ] Supabase Site URL = `https://beyondbabyco.in`
- [ ] Supabase Redirect URLs include `/auth/callback` and `/auth/callback?*`
- [ ] New deployment completed after env + code changes
- [ ] Google OAuth on production lands on `https://beyondbabyco.in/auth/callback`
- [ ] User reaches `/account` after successful sign-in

---

## Files changed in this fix

- `src/lib/app-url.ts` — production fallbacks, localhost rejection
- `src/lib/app-url.server.ts` — **new** request-origin helper
- `src/lib/auth/auth-urls.ts` — optional `baseUrl` parameter
- `src/lib/auth/customer-auth-actions.ts` — OAuth, signup, password reset use request origin
- `tests/unit/app-url.test.ts` — updated tests
- `.env.example` — production URL documentation
