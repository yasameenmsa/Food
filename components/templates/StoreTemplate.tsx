import type { ReactNode } from "react";
import { Navbar } from "@/components/organisms/Navbar";
import { Footer } from "@/components/organisms/Footer";
import { AnnouncementBar } from "@/components/organisms/AnnouncementBar";
import { CartProvider } from "@/components/molecules/cart-context";
import { hasSession } from "@/lib/auth";
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
 * The storefront shell. `forceDynamic` is inherited from the root layout, so
 * settings and the session are read fresh on every request.
 */
export async function StoreTemplate({ children }: { children: ReactNode }) {
  const [settings, announcements, isAdmin] = await Promise.all([
    getSettings(),
    getActiveAnnouncements(),
    hasSession(),
  ]);

  return (
    <CartProvider>
      <div className="flex min-h-dvh flex-col">
        <AnnouncementBar announcements={announcements} />
        <Navbar settings={settings} links={NAV_LINKS} isAdmin={isAdmin} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer settings={settings} />
      </div>
    </CartProvider>
  );
}
