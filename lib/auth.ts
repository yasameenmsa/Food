/**
 * Admin authentication.
 *
 * There is exactly one admin — the owner — and no `User` table, so this is a
 * single shared password checked against `ADMIN_PASSWORD_HASH`, exchanged for a
 * signed, expiring cookie. Sessions are stateless: nothing is stored in the
 * database, so signing out is just clearing the cookie.
 */
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  verifySessionToken,
} from "./session-token";

export { SESSION_COOKIE } from "./session-token";

export function isAdminPasswordValid(password: string): boolean {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return false;
  return bcrypt.compareSync(password, hash);
}

export async function startSession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function hasSession(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/**
 * Guard for every admin page. Redirects rather than throws, so a stale tab
 * lands on the login screen with a `next` hint instead of an error page.
 */
export async function requireSession(nextPath = "/admin"): Promise<void> {
  if (await hasSession()) return;
  const { redirect } = await import("next/navigation");
  redirect(`/login?next=${encodeURIComponent(nextPath)}`);
}
