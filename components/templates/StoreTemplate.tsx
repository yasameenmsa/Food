import type { ReactNode } from "react";
import { Navbar } from "@/components/organisms/Navbar";
import { Footer } from "@/components/organisms/Footer";
import { AnnouncementBar } from "@/components/organisms/AnnouncementBar";
import { CartProvider } from "@/components/molecules/cart-context";
import { getActiveAnnouncements } from "@/lib/dishes";
import { getSettings } from "@/lib/settings";
import type { NavLink } from "@/components/organisms/MobileNav";

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "الرئيسية", icon: "leaf" },
  { href: "/menu", label: "القائمة", icon: "utensils" },
  { href: "/specials", label: "العروض", icon: "flame" },
  { href: "/contact", label: "تواصل", icon: "mapPin" },
];

/**
 * The storefront shell.
 *
 * This deliberately does not read the session cookie. A `cookies()` call here
 * would opt every route in this group into dynamic rendering, which is why no
 * storefront page was previously static or CDN-cacheable. The only thing it was
 * buying was one "Admin" link, which now asks `/api/session` from the client.
 */
export async function StoreTemplate({ children }: { children: ReactNode }) {
  const [settings, announcements] = await Promise.all([
    getSettings(),
    getActiveAnnouncements(),
  ]);

  return (
    <CartProvider>
      <div className="flex min-h-dvh flex-col">
        <AnnouncementBar announcements={announcements} />
        <Navbar settings={settings} links={NAV_LINKS} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer settings={settings} />
      </div>
    </CartProvider>
  );
}
