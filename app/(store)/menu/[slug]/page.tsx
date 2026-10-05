import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Section, Divider } from "@/components/atoms/Layout";
import { Heading, Text } from "@/components/atoms/Typography";
import { Badge } from "@/components/atoms/Badge";
import { Icon } from "@/components/atoms/Icon";
import { PriceTag } from "@/components/molecules/PriceTag";
import { DishImage } from "@/components/molecules/DishImage";
import { DishGrid } from "@/components/organisms/DishGrid";
import { AddToOrder } from "@/components/organisms/AddToOrder";
import { getDishBySlug, getRelatedDishes } from "@/lib/dishes";
import { getSettings, whatsappLink } from "@/lib/settings";
import { dishLink, dishMessage } from "@/lib/whatsapp";

export async function generateMetadata({
  params,
}: PageProps<"/menu/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const dish = await getDishBySlug(slug);

  if (!dish) return { title: "الصنف غير موجود" };

  return {
    title: dish.name,
    description: dish.description ?? `${dish.name} من معجنات الزيتونة.`,
    openGraph: {
      title: dish.name,
      description: dish.description ?? undefined,
      images: dish.image ? [{ url: dish.image.src, width: dish.image.width, height: dish.image.height, alt: dish.image.alt }] : undefined,
    },
  };
}

export default async function DishPage({ params }: PageProps<"/menu/[slug]">) {
  const { slug } = await params;
  const [dish, settings] = await Promise.all([getDishBySlug(slug), getSettings()]);

  if (!dish) notFound();

  const related = await getRelatedDishes(dish, 4);
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alzaytona.example";

  const orderHref = whatsappLink(
    settings.whatsapp,
    dishMessage(
      { name: dish.name, price: dish.currentPrice },
      dishLink(dish.slug, origin),
      settings.currency,
    ),
  );

  return (
    <>
      <Container className="py-6">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 font-bold text-brand hover:underline"
        >
          <Icon name="chevronRight" size={18} />
          العودة للقائمة
        </Link>
      </Container>

      <Section className="pt-2">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-brand">
              <DishImage
                image={dish.image}
                name={dish.name}
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="default">{dish.categoryName}</Badge>
                {dish.special ? (
                  <Badge tone="accent">
                    <Icon name="flame" size={12} />
                    {dish.special.label ?? "عرض خاص"}
                  </Badge>
                ) : null}
                {!dish.available ? <Badge tone="danger">غير متوفر اليوم</Badge> : null}
              </div>

              <Heading level="h1" className="mt-4">
                {dish.name}
              </Heading>

              <div className="mt-3">
                <PriceTag
                  price={dish.currentPrice}
                  originalPrice={dish.special ? dish.price : null}
                  currency={settings.currency}
                  size="lg"
                />
              </div>

              {dish.description ? (
                <Text size="lg" className="mt-5">
                  {dish.description}
                </Text>
              ) : null}

              <Divider />

              <AddToOrder dish={dish} currency={settings.currency} />

              <div className="mt-4">
                <a
                  href={orderHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-bold text-brand underline underline-offset-4"
                >
                  <Icon name="whatsapp" size={18} />
                  اطلب هذا الصنف مباشرة عبر واتساب
                </a>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {related.length > 0 ? (
        <Section className="bg-surface">
          <Container>
            <Heading level="h2">من نفس القسم</Heading>
            <div className="mt-8">
              <DishGrid dishes={related} currency={settings.currency} />
            </div>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
