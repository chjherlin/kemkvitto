import { encode, getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { loadWasherBilling } from "@/lib/billing";
import {
  SESSION_MAX_AGE_SECONDS,
  sessionCookieName,
  sessionCookieOptions,
  sessionUsesSecureCookie,
} from "@/lib/session-cookie";
import { subscriptionAllowsAccess, tokenGrantsAccess } from "@/lib/subscription-rules";

const PUBLIC_PATHS = ["/login", "/register", "/privacy", "/terms", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.match(/^\/receipt\/[^/]+\/email$/)) {
    return NextResponse.next();
  }

  if (pathname.match(/^\/api\/receipts\/[^/]+\/email$/)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });
  if (!token?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/subscribe" || pathname.startsWith("/api/subscription")) {
    return NextResponse.next();
  }

  const now = Date.now();
  if (
    tokenGrantsAccess({
      status: token.subscriptionStatus,
      checkedAt: token.subscriptionCheckedAt,
      periodEnd: token.currentPeriodEnd,
      now,
    })
  ) {
    return NextResponse.next();
  }

  const billing = await loadWasherBilling(String(token.id));
  const status = billing.ok ? billing.washer.subscription_status : null;
  const periodEnd = billing.ok ? billing.washer.current_period_end : null;
  if (!subscriptionAllowsAccess(status)) {
    return NextResponse.redirect(new URL("/subscribe", request.url));
  }

  return withRefreshedSession(request, token, status, periodEnd);
}

async function withRefreshedSession(
  request: NextRequest,
  token: Record<string, unknown>,
  status: string | null,
  periodEnd: string | null
) {
  const response = NextResponse.next();
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return response;

  const secure = sessionUsesSecureCookie({
    nextAuthUrl: process.env.NEXTAUTH_URL,
    vercel: process.env.VERCEL,
    protocol: request.nextUrl.protocol,
  });
  const name = sessionCookieName(secure);
  try {
    const claims = { ...token };
    delete claims.exp;
    delete claims.iat;
    delete claims.jti;
    delete claims.nbf;
    const value = await encode({
      token: {
        ...claims,
        subscriptionStatus: status,
        currentPeriodEnd: periodEnd,
        subscriptionCheckedAt: Date.now(),
      },
      secret,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    response.cookies.set(name, value, sessionCookieOptions(secure));
  } catch {
    // Access is already allowed. The next request can read the database again.
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
