import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session-token";
import { isMobileUserAgent } from "@/lib/device";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/sell",
  "/inventory",
  "/suppliers",
  "/income",
  "/bills",
  "/reports",
  "/search",
  "/more",
  "/settings",
  "/customers",
  "/stock-take",
  "/labels",
  "/staff",
  "/branches",
  "/billing",
  "/audit-log",
  "/cashflow",
  "/write-off",
];

const AUTH_ONLY_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthOnly = AUTH_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isAuthOnly && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Phones land on the mobile hub (product search + quick actions) instead of the
  // analytics dashboard — every time, not just right after login, per spec.
  if (pathname === "/dashboard" && session && isMobileUserAgent(request.headers.get("user-agent"))) {
    return NextResponse.redirect(new URL("/search", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest).*)"],
};
