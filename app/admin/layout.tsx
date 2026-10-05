import type { ReactNode } from "react";
import { AdminTemplate } from "@/components/templates/AdminTemplate";
import { requireSession } from "@/lib/auth";

/**
 * `proxy.ts` already blocks unauthenticated requests before they get here; this
 * is the second, authoritative check for direct renders and server actions.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireSession("/admin");
  return <AdminTemplate activePath="/admin">{children}</AdminTemplate>;
}
