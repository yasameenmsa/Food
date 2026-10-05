/**
 * Menu reads. Every function here returns DTOs from `types/`, never Prisma rows,
 * so the component tree stays free of database types.
 */
import { cache } from "react";
import { tagged } from "@/lib/cached";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { AnnouncementDTO, CategoryDTO, DishDTO } from "@/types";
import { toImageDTO } from "@/lib/images";
import { searchTerms } from "@/lib/search";
import {
  TAG_ANNOUNCEMENTS,
  TAG_CATALOG,
  TAG_CATEGORIES,
  TAG_DISHES,
} from "@/lib/cache-tags";

export const MENU_PAGE_SIZE = 9;

type DishRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
  featured: boolean;
  sortOrder: number;
  categoryId: string;
  category: { name: string };
  image: {
    filename: string;
    alt: string | null;
    width: number | null;
    height: number | null;
  } | null;
  specials: {
    id: string;
    offerPrice: number;
    label: string | null;
    expiresAt: Date | null;
    startsAt: Date | null;
  }[];
};

const dishInclude = {
  category: { select: { name: true } },
  image: { select: { filename: true, alt: true, width: true, height: true } },
  specials: {
    where: { active: true },
    // Deterministic winner when a dish has more than one active special: the
    // deepest discount, earliest expiry as the tiebreak. Without an explicit
    // order Postgres returns rows in arbitrary order and `find()` below would
    // pick a different special on different requests.
    //
    // Not `as const`: that makes orderBy a readonly tuple, which Prisma's
    // mutable input type rejects.
    orderBy: [{ offerPrice: "asc" }, { expiresAt: "asc" }],
    select: {
      id: true,
      offerPrice: true,
      label: true,
      expiresAt: true,
      startsAt: true,
    },
  },
} satisfies Prisma.DishInclude;

/**
 * A special counts as live when it is active, has started if it has a
 * `startsAt`, and has not reached its `expiresAt`.
 */
function liveSpecial(row: DishRow) {
  const now = Date.now();
  return (
    row.specials.find(
      (s) =>
        (!s.startsAt || s.startsAt.getTime() <= now) &&
        (!s.expiresAt || s.expiresAt.getTime() > now),
    ) ?? null
  );
}

function toDishDTO(row: DishRow): DishDTO {
  const special = liveSpecial(row);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: row.price,
    currentPrice: special ? special.offerPrice : row.price,
    special: special
      ? {
          id: special.id,
          offerPrice: special.offerPrice,
          label: special.label,
          expiresAt: special.expiresAt ? special.expiresAt.toISOString() : null,
        }
      : null,
    available: row.available,
    featured: row.featured,
    sortOrder: row.sortOrder,
    categoryId: row.categoryId,
    categoryName: row.category.name,
    image: toImageDTO(row.image, row.name),
  };
}

export const getCategories = tagged(async (): Promise<CategoryDTO[]> => {
  const rows = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: {
      _count: { select: { dishes: { where: { available: true } } } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    dishCount: row._count.dishes,
  }));
}, [TAG_CATEGORIES, TAG_CATALOG]);

export type MenuQuery = {
  q?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
  featuredOnly?: boolean;
  hideUnavailable?: boolean;
};

export type MenuResult = {
  dishes: DishDTO[];
  total: number;
  page: number;
  pageCount: number;
};

/**
 * The menu list, filtered and paginated.
 *
 * Search matches `Dish.searchKey` — the folded concatenation of name and
 * description — so "بيزا" finds "بيتزا". Postgres cannot use a btree index for
 * a leading-wildcard LIKE, so when the optional `pg_trgm` extension and its GIN
 * index are present the same pattern is served from an index instead of a table
 * scan. Nothing here probes for the extension: when it is absent the query is
 * still correct, only slower. `Category` is a handful of rows, so matching its
 * name with a plain LIKE costs nothing.
 *
 * `specialsOnly` used to live here. It was dead code that filtered *after*
 * `take`, so page 1 would silently drop specials while reporting a correct
 * total. `/specials` uses `getSpecialDishes`, which does not paginate.
 */
export async function getDishes({
  q,
  categoryId,
  page = 1,
  pageSize = MENU_PAGE_SIZE,
  featuredOnly = false,
  hideUnavailable = true,
}: MenuQuery = {}): Promise<MenuResult> {
  const terms = searchTerms(q ?? "");

  const where = {
    ...(hideUnavailable ? { available: true } : {}),
    ...(featuredOnly ? { featured: true } : {}),
    ...(categoryId ? { categoryId } : {}),
    // Each folded term matches either the dish's own search key or a category
    // name. OR-ed per term rather than as one phrase — see `searchTerms`.
    ...(terms.length
      ? {
          OR: terms.flatMap((term) => [
            { searchKey: { contains: term } },
            {
              category: {
                name: { contains: term, mode: "insensitive" as const },
              },
            },
          ]),
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.dish.findMany({
      where,
      include: dishInclude,
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.dish.count({ where }),
  ]);

  const dishes = rows.map(toDishDTO);

  return {
    dishes,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

const readFeaturedDishes = tagged(
  async (limit: number): Promise<DishDTO[]> => {
    const rows = await prisma.dish.findMany({
      where: { featured: true, available: true },
      include: dishInclude,
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
      take: limit,
    });
    return rows.map(toDishDTO);
  },
  [TAG_DISHES, TAG_CATALOG],
);

/**
 * `limit` is passed to the cached reader rather than defaulted on it: a
 * parameter with a default is optional, and `tagged` cannot infer an argument
 * list from an optional one.
 */
export const getFeaturedDishes = cache((limit = 4) =>
  readFeaturedDishes(limit),
);

export const getSpecialDishes = tagged(async (): Promise<DishDTO[]> => {
  const rows = await prisma.dish.findMany({
    where: { available: true },
    include: dishInclude,
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
  });
  return rows.map(toDishDTO).filter((dish) => dish.special !== null);
}, [TAG_DISHES, TAG_CATALOG]);

export const getDishBySlug = tagged(
  async (slug: string): Promise<DishDTO | null> => {
    const row = await prisma.dish.findUnique({
      where: { slug },
      include: dishInclude,
    });
    return row ? toDishDTO(row) : null;
  },
  [TAG_DISHES, TAG_CATALOG],
);

/** Same category, excluding the dish itself. */
const readRelatedDishes = tagged(
  // `dish` and `limit` are passed as arguments rather than closed over, because
  // `unstable_cache` derives its key from the arguments it is called with. A
  // closure would give every dish on the site the same cache entry.
  async (
    dishId: string,
    categoryId: string,
    take: number,
  ): Promise<DishDTO[]> => {
    const rows = await prisma.dish.findMany({
      where: { categoryId, available: true, id: { not: dishId } },
      include: dishInclude,
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      take,
    });
    return rows.map(toDishDTO);
  },
  [TAG_DISHES, TAG_CATALOG],
);

/**
 * Same category, excluding the dish itself.
 *
 * Takes the dish for a friendlier call site, but `readRelatedDishes` receives
 * plain scalars so they land in the cache key — a closure would give every dish
 * on the site the same entry.
 */
export const getRelatedDishes = cache((dish: DishDTO, limit = 4) =>
  readRelatedDishes(dish.id, dish.categoryId, limit),
);

/** For the cart: re-read prices server-side so a tampered form cannot lie. */
export async function getDishesByIds(ids: string[]): Promise<DishDTO[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.dish.findMany({
    where: { id: { in: ids }, available: true },
    include: dishInclude,
  });
  return rows.map(toDishDTO);
}

export const getActiveAnnouncements = tagged(async (): Promise<
  AnnouncementDTO[]
> => {
  const now = new Date();
  const rows = await prisma.announcement.findMany({
    where: {
      active: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    active: row.active,
  }));
}, [TAG_ANNOUNCEMENTS, TAG_CATALOG]);

/** Every dish, for the admin table. */
export async function getAllDishes(): Promise<DishDTO[]> {
  const rows = await prisma.dish.findMany({
    include: dishInclude,
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
  });
  return rows.map(toDishDTO);
}

export async function getDishById(id: string): Promise<DishDTO | null> {
  const row = await prisma.dish.findUnique({
    where: { id },
    include: dishInclude,
  });
  return row ? toDishDTO(row) : null;
}
