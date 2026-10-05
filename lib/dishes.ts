/**
 * Menu reads. Every function here returns DTOs from `types/`, never Prisma rows,
 * so the component tree stays free of database types.
 */
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { AnnouncementDTO, CategoryDTO, DishDTO } from "@/types";
import { toImageDTO } from "@/lib/images";

export const MENU_PAGE_SIZE = 9;

type DishRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
  featured: boolean;
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
  }[];
};

const dishInclude = {
  category: { select: { name: true } },
  image: { select: { filename: true, alt: true, width: true, height: true } },
  specials: {
    where: { active: true },
    select: { id: true, offerPrice: true, label: true, expiresAt: true },
  },
} as const;

/**
 * A special counts as live when it is active and either has no end date or has
 * not reached it. `startsAt` is ignored here because the admin form only ever
 * creates specials that are live now.
 */
function liveSpecial(row: DishRow) {
  const now = Date.now();
  return (
    row.specials.find((s) => !s.expiresAt || s.expiresAt.getTime() > now) ?? null
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
    categoryId: row.categoryId,
    categoryName: row.category.name,
    image: toImageDTO(row.image, row.name),
  };
}

/** Sorts cheapest-last specials to the front of a grid without an extra query. */
function byMenuOrder<T extends { categoryId: string; id: string }>(a: T, b: T) {
  return a.categoryId === b.categoryId
    ? a.id.localeCompare(b.id)
    : a.categoryId.localeCompare(b.categoryId);
}

export const getCategories = cache(async (): Promise<CategoryDTO[]> => {
  const rows = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { dishes: { where: { available: true } } } } },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    dishCount: row._count.dishes,
  }));
});

export type MenuQuery = {
  q?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
  featuredOnly?: boolean;
  specialsOnly?: boolean;
  hideUnavailable?: boolean;
};

export type MenuResult = {
  dishes: DishDTO[];
  total: number;
  page: number;
  pageCount: number;
};

/**
 * The menu list, filtered and paginated. Search matches the dish name or the
 * category name so "pizza" style typos in Arabic still land somewhere sensible.
 */
export async function getDishes({
  q,
  categoryId,
  page = 1,
  pageSize = MENU_PAGE_SIZE,
  featuredOnly = false,
  specialsOnly = false,
  hideUnavailable = true,
}: MenuQuery = {}): Promise<MenuResult> {
  const where = {
    ...(hideUnavailable ? { available: true } : {}),
    ...(featuredOnly ? { featured: true } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            { category: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.dish.findMany({
      where,
      include: dishInclude,
      orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.dish.count({ where }),
  ]);

  let dishes = rows.map(toDishDTO);

  // A special is a joined table, so it cannot be filtered in SQL without a
  // subquery. Narrowing after the fact is fine at menu scale.
  if (specialsOnly) dishes = dishes.filter((dish) => dish.special !== null);

  return {
    dishes: dishes.sort(byMenuOrder),
    total: specialsOnly ? dishes.length : total,
    page,
    pageCount: Math.max(1, Math.ceil((specialsOnly ? dishes.length : total) / pageSize)),
  };
}

export const getFeaturedDishes = cache(async (limit = 4): Promise<DishDTO[]> => {
  const rows = await prisma.dish.findMany({
    where: { featured: true, available: true },
    include: dishInclude,
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    take: limit,
  });
  return rows.map(toDishDTO);
});

export const getSpecialDishes = cache(async (): Promise<DishDTO[]> => {
  const rows = await prisma.dish.findMany({
    where: { available: true },
    include: dishInclude,
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
  });
  return rows.map(toDishDTO).filter((dish) => dish.special !== null);
});

export const getDishBySlug = cache(async (slug: string): Promise<DishDTO | null> => {
  const row = await prisma.dish.findUnique({
    where: { slug },
    include: dishInclude,
  });
  return row ? toDishDTO(row) : null;
});

/** Same category, excluding the dish itself. */
export const getRelatedDishes = cache(
  async (dish: DishDTO, limit = 4): Promise<DishDTO[]> => {
    const rows = await prisma.dish.findMany({
      where: { categoryId: dish.categoryId, available: true, id: { not: dish.id } },
      include: dishInclude,
      orderBy: { sortOrder: "asc" },
      take: limit,
    });
    return rows.map(toDishDTO);
  },
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

export const getActiveAnnouncements = cache(async (): Promise<AnnouncementDTO[]> => {
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
  return rows.map((row) => ({ id: row.id, body: row.body, active: row.active }));
});

/** Every dish, for the admin table. */
export async function getAllDishes(): Promise<DishDTO[]> {
  const rows = await prisma.dish.findMany({
    include: dishInclude,
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
  });
  return rows.map(toDishDTO);
}

export async function getDishById(id: string): Promise<DishDTO | null> {
  const row = await prisma.dish.findUnique({ where: { id }, include: dishInclude });
  return row ? toDishDTO(row) : null;
}