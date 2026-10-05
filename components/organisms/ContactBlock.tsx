import { Container, Section } from "@/components/atoms/Layout";
import { Heading, Text } from "@/components/atoms/Typography";
import { Icon } from "@/components/atoms/Icon";
import { InfoRow, SocialLinks, type SocialLink } from "@/components/molecules/InfoRow";
import { CopyButton } from "@/components/molecules/CopyButton";
import { OpeningHoursPanel } from "./OpeningHoursPanel";
import type { Settings } from "@/lib/settings";

export function ContactBlock({
  settings,
  isOpen,
  openNote,
}: {
  settings: Settings;
  isOpen: boolean;
  openNote: string | null;
}) {
  const socials: SocialLink[] = [
    {
      name: "whatsapp",
      label: "واتساب",
      href: `https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`,
    },
    ...(settings.phone
      ? [{ name: "phone" as const, label: "اتصال", href: `tel:${settings.phone}` }]
      : []),
    ...(settings.instagram
      ? [
          {
            name: "instagram" as const,
            label: "إنستغرام",
            href: `https://instagram.com/${settings.instagram.replace(/^@/, "")}`,
          },
        ]
      : []),
    ...(settings.facebook
      ? [
          {
            name: "facebook" as const,
            label: "فيسبوك",
            href: `https://facebook.com/${settings.facebook.replace(/^@/, "")}`,
          },
        ]
      : []),
    ...(settings.tiktok
      ? [
          {
            name: "tiktok" as const,
            label: "تيك توك",
            href: `https://tiktok.com/@${settings.tiktok.replace(/^@/, "")}`,
          },
        ]
      : []),
  ];

  return (
    <>
      <Section>
        <Container>
          <Heading level="h1">تواصل معنا</Heading>
          <Text tone="muted" className="mt-2">
            أسرع طريقة للوصول إلينا هي واتساب.
          </Text>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="space-y-5 rounded-lg border border-line bg-surface p-6 shadow-brand">
              <InfoRow icon="whatsapp" label="واتساب">
                <span className="nums">{settings.whatsapp}</span>
              </InfoRow>

              {settings.phone ? (
                <InfoRow icon="phone" label="الهاتف">
                  <a href={`tel:${settings.phone}`} className="nums link-underline">
                    {settings.phone}
                  </a>
                </InfoRow>
              ) : null}

              {settings.email ? (
                <InfoRow icon="external" label="البريد الإلكتروني">
                  <span className="ltr-run">{settings.email}</span>
                </InfoRow>
              ) : null}

              <InfoRow icon="mapPin" label="العنوان">
                <span>{settings.address}</span>
                {settings.city ? <span className="block text-muted">{settings.city}</span> : null}
              </InfoRow>

              {settings.deliveryAreas ? (
                <InfoRow icon="cart" label="مناطق التوصيل">
                  {settings.deliveryAreas}
                </InfoRow>
              ) : null}

              <div className="pt-1">
                <SocialLinks links={socials} />
              </div>

              {settings.phone ? (
                <div className="pt-1">
                  <CopyButton value={settings.phone} label="نسخ رقم الهاتف" />
                </div>
              ) : null}

              {settings.mapUrl ? (
                <a
                  href={settings.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-bold text-brand underline underline-offset-4"
                >
                  <Icon name="mapPin" size={18} />
                  اعرض الموقع على الخريطة
                </a>
              ) : null}
            </div>

            <div>
              <OpeningHoursPanel settings={settings} isOpen={isOpen} openNote={openNote} />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
