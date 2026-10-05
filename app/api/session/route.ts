import { NextResponse } from "next/server";
import { hasSession } from "@/lib/auth";

/**
 * Is the visitor the owner?
 *
 * This exists so the storefront shell can stop reading the session cookie. A
 * `cookies()` call anywhere in the shell opts the whole route group into
 * dynamic rendering, which meant no storefront page was static or CDN-cacheable
 * — for the sake of one "Admin" link.
 *
 * The answer changes rarely, so the client caches it briefly. It is never used
 * for authorisation: every admin page and every admin action independently calls
 * `requireSession()`, and `proxy.ts` filters `/admin/*` before a database query.
 */
export async function GET() {
  const isAdmin = await hasSession();
  return NextResponse.json(
    { isAdmin },
    {
      // Private: this is per-visitor, never a shared-cache entry.
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}
