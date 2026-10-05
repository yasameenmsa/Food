import Link from "next/link";
import { Icon } from "@/components/atoms/Icon";
import { MobileNav, type NavLink } from "./MobileNav";
import { AdminLink } from "@/components/molecules/AdminLink";
import type { Settings } from "@/lib/settings";

export type NavbarProps = {
  settings: Settings;
  links: NavLink[];
};

export function Navbar({ settings, links }: NavbarProps) {
  const whatsappHref = `https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl leading-none">
          <Icon name="leaf" size={26} className="text-brand" />
          <span>{settings.name}</span>
        </Link>

        <nav aria-label="التنقل الرئيسي" className="ms-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex items-center gap-2 rounded-card px-3 py-2 font-bold text-brand transition-colors hover:bg-stone/40"
                >
                  {link.icon ? <Icon name={link.icon} size={18} /> : null}
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ms-auto flex items-center gap-2 md:ms-0">
          <AdminLink variant="icon" />

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-11 items-center gap-2 rounded-card bg-brand px-4 font-bold text-brand-foreground transition-colors hover:bg-accent sm:inline-flex"
          >
            <Icon name="whatsapp" size={18} />
            اطلب عبر واتساب
          </a>

          <MobileNav
            links={links}
            whatsappHref={whatsappHref}
            whatsappNumber={settings.whatsapp}
            siteName={settings.name}
          />
        </div>
      </div>
    </header>
  );
}