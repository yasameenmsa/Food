"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/atoms/Icon";
import { AdminLink } from "@/components/molecules/AdminLink";

export type NavLink = {
  href: string;
  label: string;
  icon?: IconName;
  /** Also light up for nested routes, e.g. /admin/orders. */
  matchPrefix?: boolean;
};

export type MobileNavProps = {
  links: NavLink[];
  whatsappHref?: string;
  whatsappNumber?: string;
  siteName: string;
};

/**
 * The drawer. Traps nothing fancy, but it does the three things that matter:
 * closes on Escape, closes on route change, and hands focus back to the button
 * that opened it.
 */
export function MobileNav({
  links,
  whatsappHref,
  whatsappNumber,
  siteName,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    // Stop the page behind the drawer from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const isActive = (link: NavLink) =>
    link.matchPrefix ? pathname.startsWith(link.href) : pathname === link.href;

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
        className="flex size-11 items-center justify-center rounded-card border-2 border-line text-brand"
      >
        <Icon name={open ? "close" : "menu"} size={22} />
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-olive/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            ref={panelRef}
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="قائمة التنقل"
            className="fixed inset-x-0 top-0 z-50 max-h-[85vh] overflow-y-auto rounded-b-lg bg-cream p-4 shadow-lift"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-xl">{siteName}</span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                aria-label="إغلاق القائمة"
                className="flex size-11 items-center justify-center rounded-card border-2 border-line text-brand"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <ul className="flex flex-col gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive(link) ? "page" : undefined}
                    className={[
                      "flex items-center gap-3 rounded-card px-3 py-3 text-lg font-bold",
                      isActive(link)
                        ? "bg-brand text-brand-foreground"
                        : "text-brand hover:bg-stone/40",
                    ].join(" ")}
                  >
                    {link.icon ? <Icon name={link.icon} size={20} /> : null}
                    {link.label}
                  </Link>
                </li>
              ))}
              <AdminLink variant="drawer" />
            </ul>

            {whatsappHref && whatsappNumber ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex h-13 items-center justify-center gap-2 rounded-card bg-brand px-6 text-lg font-bold text-brand-foreground"
              >
                <Icon name="whatsapp" size={20} />
                <span className="nums">{whatsappNumber}</span>
              </a>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}