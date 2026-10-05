import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

/**
 * Guard for `/admin/*`.
 *
 * The cookie is verified here so a signed-out request never reaches a database
 * query or renders an admin shell. Pages still call `requireSession()` — this is
 * a fast first filter, not the only one.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authorized = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (authorized) return NextResponse.next();

  const login = new URL("/login", request.url);
  // Remember where they were headed, but only for paths inside this app.
  login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*"],
};
