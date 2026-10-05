import type { MetadataRoute } from "next";
import { getAllDishes } from "@/lib/dishes";
import { siteUrl } from "@/lib/site";

/**
 * Every product page, plus the storefront. Excludes /admin, /login, /cart and
 * /order — see `app/robots.ts` for why those are also disallowed.
 *
 * `getAllDishes` is tagged, so this shares the same cached rows the menu grid
 * renders and costs no extra query per page.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/menu`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/specials`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${base}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // A build worker has no database. Without this guard a `next build` on a
  // machine that cannot reach Postgres fails outright, which is the wrong
  // trade: a sitemap with no product URLs is far better than no deploy. The
  // route re-runs at request time, when the database is reachable.
  let dishes: Awaited<ReturnType<typeof getAllDishes>> = [];
  try {
    dishes = await getAllDishes();
  } catch (error) {
    console.warn(
      "[sitemap] Could not read dishes at build time; serving static routes only.",
      error instanceof Error ? error.message : error,
    );
  }

  return [
    ...staticRoutes,
    ...dishes
      .filter((dish) => dish.available)
      .map((dish) => ({
        url: `${base}/menu/${encodeURIComponent(dish.slug)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
  ];
}
