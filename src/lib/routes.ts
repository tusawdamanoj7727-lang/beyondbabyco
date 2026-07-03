/** Customer auth routes — used to hide marketing chrome on focused auth screens. */
export const CUSTOMER_AUTH_PATHS = ["/login", "/register", "/forgot-password"] as const;

export function isCustomerAuthPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return CUSTOMER_AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Safe internal redirect for customer area (blocks open redirects). */
export function resolveCustomerRedirect(target: string | undefined): string {
  if (target && target.startsWith("/") && !target.startsWith("//") && !target.startsWith("/admin")) {
    return target;
  }
  return "/account";
}
