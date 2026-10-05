import Link from "next/link";
import { Container } from "@/components/atoms/Layout";
import { Icon } from "@/components/atoms/Icon";
import { Divider } from "@/components/atoms/Layout";
import { SocialLinks, type SocialLink } from "@/components/molecules/InfoRow";
import { DAY_NAMES_AR, formatDayWindow } from "@/lib/hours";
import type { Settings } from "@/lib/settings";

function socialLinks(settings: Settings): SocialLink[] {
  const links: SocialLink[] = [];
  if (settings.whatsapp) {
    links.push({
      name: "whatsapp",
      label: "واتساب",
      href: `https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`,
    });
  }
  if (settings.phone) {
    links.push({ name: "phone", label: "اتصال هاتفي", href: `tel:${settings.phone}` });
  }
  if (settings.instagram) {
    links.push({
      name: "instagram",
      label: "إنستغرام",
      href: `https://instagram.com/${settings.instagram.replace(/^@/, "")}`,
    });
  }
  if (settings.facebook) {
    links.push({
      name: "facebook",
      label: "فيسبوك",
      href: `https://facebook.com/${settings.facebook.replace(/^@/, "")}`,
    });
  }
  if (settings.tiktok) {
    links.push({
      name: "tiktok",
      label: "تيك توك",
      href: `https://tiktok.com/@${settings.tiktok.replace(/^@/, "")}`,
    });
  }
  return links;
}

const SHOP_LINKS = [
  { href: "/menu", label: "القائمة" },
  { href: "/specials", label: "العروض" },
  { href: "/contact", label: "تواصل معنا" },
];

export function Footer({ settings }: { settings: Settings }) {
  const todayIndex = new Date().getDay();
  const todayWindow = settings.openingHours[String(todayIndex)] ?? null;

  return (
    <footer className="mt-auto bg-brown text-brand-foreground">
      <Container className="py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="flex items-center gap-2 font-display text-2xl">
              <Icon name="leaf" size={26} />
              {settings.name}
            </p>
            {settings.tagline ? (
              <p className="mt-2 opacity-90">{settings.tagline}</p>
            ) : null}
            <div className="mt-5">
              <SocialLinks links={socialLinks(settings)} />
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl">روابط</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="link-underline">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/menu" className="link-underline">
                  اطلب عبر واتساب
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl">أوقات الدوام</h2>
            <dl className="mt-3 flex flex-col gap-1 text-sm">
              {DAY_NAMES_AR.map((day, index) => {
                const window = settings.openingHours[String(index)] ?? null;
                const isToday = index === todayIndex;
                return (
                  <div
                    key={day}
                    className={`flex justify-between gap-3 ${isToday ? "font-bold" : ""}`}
                  >
                    <dt>{day}</dt>
                    <dd className="nums">{formatDayWindow(window)}</dd>
                  </div>
                );
              })}
            </dl>
            {todayWindow ? (
              <p className="mt-3 text-sm opacity-90">
                اليوم: <span className="nums">{formatDayWindow(todayWindow)}</span>
              </p>
            ) : null}
          </div>
        </div>

        <Divider className="my-8 opacity-40" />

        <div className="flex flex-col gap-2 text-sm opacity-90 md:flex-row md:items-center md:justify-between">
          <p>
            {settings.address ? <span>{settings.address}</span> : null}
            {settings.city ? <span> — {settings.city}</span> : null}
          </p>
          <p>© {new Date().getFullYear()} {settings.name}</p>
        </div>
      </Container>
    </footer>
  );
}