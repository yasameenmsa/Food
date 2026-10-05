import type { Metadata } from "next";
import { Container } from "@/components/atoms/Layout";
import { Heading } from "@/components/atoms/Typography";
import { DishGrid } from "@/components/organisms/DishGrid";
import { Pagination } from "@/components/molecules/Pagination";
import {
  ActiveFilters,
  CategorySidebar,
  MenuToolbar,
} from "@/components/organisms/MenuToolbar";
import { getCategories, getDishes } from "@/lib/dishes";
import { getSettings, whatsappLink } from "@/lib/settings";
import { dishLink, dishMessage } from "@/lib/whatsapp";
import { siteUrl } from "@/lib/site";
import { notFound } from "next/navigation";

/**
 * ISR window. Every admin write calls `revalidateTag` so this is only the
 * backstop for a change that happens outside the admin — an edited row, or a
 * deploy. One hour keeps a stale menu from outliving its usefulness.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "القائمة",
  description: "كل أصناف معجنات الزيتونة — بيتزا، صفيحة، معجنات وعجينات.",
};

export default async function MenuPage({ searchParams }: PageProps<"/menu">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const categoryId = typeof params.category === "string" ? params.category : undefined;
  const rawPage = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const [settings, categories, result] = await Promise.all([
    getSettings(),
    getCategories(),
    getDishes({
      q: query || undefined,
      categoryId,
      page,
      // Availability is shown as a label rather than used to hide the dish, so
      // a guest can still see what exists today.
      pageSize: 9,
    }),
  ]);

  // A category id that no longer exists should not render as "no results".
  if (categoryId && !categories.some((category) => category.id === categoryId)) {
    notFound();
  }

  const origin = siteUrl();

  const hrefFor = (dish: (typeof result.dishes)[number]) =>
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

  const filters = { category: categoryId, q: query || undefined };

  return (
    <Container className="py-8 md:py-12">
      <Heading level="h1">القائمة</Heading>

      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_1fr]">
        <CategorySidebar
          categories={categories}
          activeCategoryId={categoryId}
          query={query}
        />

        <div>
          <MenuToolbar
            categories={categories}
            activeCategoryId={categoryId}
            query={query}
            page={result.page}
            total={result.total}
          />

          <div className="mt-4">
            <ActiveFilters
              categories={categories}
              activeCategoryId={categoryId}
              query={query}
            />
          </div>

          <div className="mt-6">
            <DishGrid
              dishes={result.dishes}
              currency={settings.currency}
              whatsappHrefFor={hrefFor}
              sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 90vw"
              emptyAction={{ href: "/menu", label: "امسح الفلاتر" }}
            />
          </div>

          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            basePath="/menu"
            params={filters}
          />
        </div>
      </div>
    </Container>
  );
}
