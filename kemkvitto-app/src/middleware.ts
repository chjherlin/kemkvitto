import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow the customer email page (no auth needed — customer-facing)
  if (pathname.match(/^\/receipt\/[^/]+\/email$/)) {
    return NextResponse.next();
  }

  // Allow API receipt email endpoint (customer submits email)
  if (pathname.match(/^\/api\/receipts\/[^/]+\/email$/)) {
    return NextResponse.next();
  }

  // Allow payment pages and APIs (customer-facing)
  if (pathname.startsWith("/pay/")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/pay/")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/payments/")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next();
  }

  // Allow cron endpoint (would be protected by secret in production)
  if (pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
