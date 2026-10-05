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
import { getAllDishes, getDishBySlug, getRelatedDishes } from "@/lib/dishes";
import { getSettings, whatsappLink } from "@/lib/settings";
import { dishLink, dishMessage } from "@/lib/whatsapp";
import { productJsonLd } from "@/lib/jsonld";
import { absoluteUrl } from "@/lib/site";
import { siteUrl } from "@/lib/site";

/**
 * ISR window. Every admin write calls `revalidateTag` so this is only the
 * backstop for a change that happens outside the admin — an edited row, or a
 * deploy. One hour keeps a stale menu from outliving its usefulness.
 */
export const revalidate = 3600;

/**
 * Prerender every product page at build time, then revalidate hourly and
 * immediately on any admin write. Without this the route is server-rendered on
 * demand forever and `revalidate` has nothing to attach to.
 *
 * Opt-in via `PRERENDER_PRODUCTS=1` rather than automatic, because prerendering
 * one page per dish means one database query set per dish during the build.
 * `pnpm db:local` is PGlite-backed and serves a single connection
 * (`DATABASE_MAX_CONNECTIONS=1`), which those workers overrun — the build dies
 * with "Connection terminated unexpectedly". Production Postgres has no such
 * limit, so it sets the flag and gets the full prerender.
 *
 * Unset, the route renders on demand and is still tagged, so an admin edit still
 * lands immediately via `updateTag`. The only thing lost is the cold-start win.
 */
export async function generateStaticParams() {
  if (process.env.PRERENDER_PRODUCTS !== "1") return [];

  try {
    const dishes = await getAllDishes();
    return dishes
      .filter((dish) => dish.available)
      .map((dish) => ({ slug: dish.slug }));
  } catch (error) {
    // A build must never fail because the menu could not be read. Degrade to
    // on-demand rendering rather than blocking a deploy.
    console.warn(
      "[generateStaticParams] Could not read dishes at build time; product pages will render on demand.",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

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
      images: dish.image
        ? [
            {
              url: absoluteUrl(dish.image.src),
              width: dish.image.width,
              height: dish.image.height,
              alt: dish.image.alt,
            },
          ]
        : undefined,
    },
  };
}

export default async function DishPage({ params }: PageProps<"/menu/[slug]">) {
  const { slug } = await params;
  const [dish, settings] = await Promise.all([
    getDishBySlug(slug),
    getSettings(),
  ]);

  if (!dish) notFound();

  const related = await getRelatedDishes(dish, 4);
  const origin = siteUrl();

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd(dish, settings)),
        }}
      />

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
                {!dish.available ? (
                  <Badge tone="danger">غير متوفر اليوم</Badge>
                ) : null}
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
