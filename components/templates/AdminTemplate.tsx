import type { ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/atoms/Icon";
import { logout } from "@/app/login/actions";
import { getSettings } from "@/lib/settings";

const ADMIN_LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "الطلبات", icon: "dashboard" },
  { href: "/admin/dishes", label: "الأصناف", icon: "utensils" },
  { href: "/admin/settings", label: "الإعدادات", icon: "settings" },
];

export type AdminTemplateProps = {
  children: ReactNode;
  /** `?status=PENDING` style filter, so the nav can reflect the active list. */
  activePath: string;
};

export async function AdminTemplate({ children, activePath }: AdminTemplateProps) {
  const settings = await getSettings();

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-display text-xl leading-none">
            <Icon name="leaf" size={24} className="text-brand" />
            {settings.name}
          </Link>
          <span className="rounded-full bg-stone/50 px-3 py-1 text-xs font-bold text-muted">
            لوحة التحكم
          </span>

          <form action={logout} className="ms-auto">
            <button
              type="submit"
              className="inline-flex h-11 items-center gap-2 rounded-card px-3 font-bold text-brand transition-colors hover:bg-stone/40"
            >
              <Icon name="logout" size={18} />
              خروج
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:py-8">
        <nav aria-label="أقسام لوحة التحكم" className="md:w-56 md:shrink-0">
          <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-col md:px-0">
            {ADMIN_LINKS.map((link) => {
              const active = activePath === link.href;
              return (
                <li key={link.href} className="shrink-0 md:shrink">
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "flex items-center gap-2 rounded-card px-4 py-3 font-bold transition-colors",
                      active ? "bg-brand text-brand-foreground" : "text-brand hover:bg-stone/40",
                    ].join(" ")}
                  >
                    <Icon name={link.icon} size={18} />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link
            href="/"
            className="mt-4 hidden items-center gap-2 px-4 text-sm font-semibold text-muted hover:text-brand md:inline-flex"
          >
            <Icon name="external" size={16} />
            عرض الموقع
          </Link>
        </nav>

        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}