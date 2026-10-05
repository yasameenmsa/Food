import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthTemplate } from "@/components/templates/AuthTemplate";
import { LoginForm } from "./LoginForm";
import { hasSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "دخول",
  robots: { index: false, follow: false },
};

/** Only same-origin paths, so `?next=` cannot be used to bounce elsewhere. */
function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await hasSession()) redirect("/admin");

  const params = await searchParams;
  const next = safeNext(params.next);

  return (
    <AuthTemplate title="لوحة التحكم" subtitle="أدخل كلمة المرور للمتابعة.">
      <LoginForm nextPath={next} />
    </AuthTemplate>
  );
}
