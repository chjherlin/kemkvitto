/** One year. The cookie must carry Max-Age, or Safari drops it when the tab closes. */
export const SESSION_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
/** One day. NextAuth refreshes a database session on this interval. JWT sessions are refreshed on use. */
export const SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60;

/**
 * Same rule as next-auth's getToken: the secure cookie name is used on https
 * and on Vercel. A missing Max-Age makes the cookie a browser-session cookie.
 */
export function sessionUsesSecureCookie(input: {
  nextAuthUrl?: string | null;
  vercel?: string | null;
  protocol?: string | null;
}): boolean {
  if (input.nextAuthUrl?.startsWith("https://")) return true;
  if (input.vercel) return true;
  return input.protocol === "https:";
}

export function sessionCookieName(secure: boolean): string {
  return secure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
}

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure,
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
