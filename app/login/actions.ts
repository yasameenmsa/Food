"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { endSession, isAdminPasswordValid, startSession } from "@/lib/auth";
import {
  clearFailures,
  isLockedOut,
  recordFailure,
  MAX_ATTEMPTS,
} from "@/lib/login-throttle";

export type LoginState = {
  ok: boolean;
  error?: string;
};

/** Only allow a same-origin `next`, so the param cannot be used as an open redirect. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
}

/**
 * The client address, taken from the first value of `x-forwarded-for` when a
 * proxy sets it and from the socket otherwise. Hashing happens in
 * `lib/login-throttle`; the raw address never reaches the database.
 */
async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first && first.length > 0 ? first : (h.get("x-real-ip") ?? "unknown");
}

export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  const ip = await clientIp();

  if (!password) {
    return { ok: false, error: "أدخل كلمة المرور." };
  }

  // Checked before the bcrypt compare so a locked-out client costs us nothing.
  if (await isLockedOut(ip)) {
    return {
      ok: false,
      error: `محاولات كثيرة فاشلة. انتظر ١٥ دقيقة قبل المحاولة مرة أخرى (الحد ${MAX_ATTEMPTS} محاولات).`,
    };
  }

  if (!isAdminPasswordValid(password)) {
    // Deliberately vague: saying "wrong password" confirms the form is real.
    // Once the cap is hit the message changes, which tells the owner they are
    // locked out rather than that their password is wrong.
    const locked = await recordFailure(ip);
    if (locked) {
      return {
        ok: false,
        error: `محاولات كثيرة فاشلة. انتظر ١٥ دقيقة قبل المحاولة مرة أخرى (الحد ${MAX_ATTEMPTS} محاولات).`,
      };
    }
    return { ok: false, error: "كلمة المرور غير صحيحة." };
  }

  // One typo must not cascade into a lockout after a later correct attempt.
  await clearFailures(ip);
  await startSession();
  redirect(next);
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/");
}
