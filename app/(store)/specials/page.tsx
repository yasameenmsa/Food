import type { Metadata } from "next";
import { Container, Section } from "@/components/atoms/Layout";
import { Heading, Text } from "@/components/atoms/Typography";
import { DishGrid } from "@/components/organisms/DishGrid";
import { getSpecialDishes } from "@/lib/dishes";
import { getSettings, whatsappLink } from "@/lib/settings";
import { dishLink, dishMessage } from "@/lib/whatsapp";
import { siteUrl } from "@/lib/site";

/**
 * ISR window. Every admin write calls `revalidateTag` so this is only the
 * backstop for a change that happens outside the admin — an edited row, or a
 * deploy. One hour keeps a stale menu from outliving its usefulness.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "العروض",
  description: "عروض وأسعار مخفّضة على أصناف معجنات الزيتونة لفترة محدودة.",
};

export default async function SpecialsPage() {
  const [settings, specials] = await Promise.all([getSettings(), getSpecialDishes()]);

  const origin = siteUrl();
  const hrefFor = (dish: (typeof specials)[number]) =>
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
    <Section>
      <Container>
        <Heading level="h1">العروض</Heading>
        <Text tone="muted" className="mt-2">
          أسعار مخفّضة لفترة محدودة، بحدّ المخزون.
        </Text>

        <div className="mt-8">
          <DishGrid
            dishes={specials}
            currency={settings.currency}
            whatsappHrefFor={hrefFor}
            priorityFirst
            emptyMessage="لا توجد عروض حاليًا. تابعنا قريبًا."
            emptyAction={{ href: "/menu", label: "تصفّح القائمة" }}
          />
        </div>
      </Container>
    </Section>
  );
}
