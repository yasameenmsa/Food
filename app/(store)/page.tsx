import { Hero } from "@/components/organisms/Hero";
import { FeaturedDishes, SpecialsStrip } from "@/components/organisms/FeaturedDishes";
import { ContactBlock } from "@/components/organisms/ContactBlock";
import { Section, Container } from "@/components/atoms/Layout";
import { Heading, Text } from "@/components/atoms/Typography";
import {
  getCategories,
  getFeaturedDishes,
  getSpecialDishes,
} from "@/lib/dishes";
import { getOpenState, describeNextChange } from "@/lib/hours";
import { getSettings, whatsappDigits, whatsappLink } from "@/lib/settings";
import { dishLink, dishMessage } from "@/lib/whatsapp";
import { restaurantJsonLd } from "@/lib/jsonld";
import { siteUrl } from "@/lib/site";

/**
 * ISR window. Every admin write calls `revalidateTag` so this is only the
 * backstop for a change that happens outside the admin — an edited row, or a
 * deploy. One hour keeps a stale menu from outliving its usefulness.
 */
export const revalidate = 3600;

export default async function HomePage() {
  const [settings, categories, featured, specials] = await Promise.all([
    getSettings(),
    getCategories(),
    getFeaturedDishes(4),
    getSpecialDishes(),
  ]);

  const now = new Date();
  const ordering = getOpenState(settings.orderingHours, now, settings.timezone);
  const openNote = ordering.isOpen
    ? null
    : describeNextChange(settings.orderingHours, now, settings.timezone, "kitchen");

  const origin = siteUrl();
  const whatsappHref = whatsappLink(settings.whatsapp, "مرحبًا! أودّ الطلب من معجنات الزيتونة.");

  const hrefFor = (dish: (typeof featured)[number]) =>
    dish.available
      ? whatsappLink(
          settings.whatsapp,
          dishMessage(
            { name: dish.name, price: dish.currentPrice },
            dishLink(dish.slug, origin),
            settings.currency,
          ),
        )
      : undefined;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd(settings)) }}
      />

      <Hero
        settings={settings}
        whatsappHref={whatsappHref}
        isOpen={ordering.isOpen}
        openNote={openNote}
        deliveryAreas={settings.deliveryAreas}
      />

      <FeaturedDishes
        dishes={featured}
        categories={categories}
        whatsappHrefFor={hrefFor}
        currency={settings.currency}
      />

      <SpecialsStrip
        dishes={specials}
        whatsappHrefFor={hrefFor}
        currency={settings.currency}
      />

      <Section className="bg-surface">
        <Container>
          <Heading level="h2">تفضّل تطلب عبر واتساب؟</Heading>
          <Text tone="muted" className="mt-2 max-w-2xl">
            أرسل لنا الأصناف التي تريدها وسنجهّزها فورًا. نطلب تأكيدًا على كل طلب قبل
            التحضير.
          </Text>
          <a
            href={whatsappLink(settings.whatsapp, "مرحبًا! أودّ طلبًا من معجنات الزيتونة.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-13 items-center gap-2 rounded-card bg-brand px-6 text-lg font-bold text-brand-foreground transition-colors hover:bg-accent"
          >
            <span className="nums">{whatsappDigits(settings.whatsapp)}</span>
          </a>
        </Container>
      </Section>

      <ContactBlock settings={settings} isOpen={ordering.isOpen} openNote={openNote} />
    </>
  );
}
