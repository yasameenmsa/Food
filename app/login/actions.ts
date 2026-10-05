"use server";

import { redirect } from "next/navigation";
import { endSession, isAdminPasswordValid, startSession } from "@/lib/auth";

export type LoginState = {
  ok: boolean;
  error?: string;
};

/** Only allow a same-origin `next`, so the param cannot be used as an open redirect. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
}

export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!password) {
    return { ok: false, error: "أدخل كلمة المرور." };
  }

  if (!isAdminPasswordValid(password)) {
    // Deliberately vague: saying "wrong password" confirms the form is real.
    return { ok: false, error: "كلمة المرور غير صحيحة." };
  }

  await startSession();
  redirect(next);
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/");
}
