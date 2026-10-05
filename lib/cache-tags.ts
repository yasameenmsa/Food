/**
 * Cache tags for the storefront catalog.
 *
 * The catalog used to render dynamic on every request because the storefront
 * shell read the session cookie, which dragged the whole route group with it.
 * The session only ever decided whether to show one "Admin" link, so it moved to
 * `/api/session` and the shell became cacheable.
 *
 * Every admin mutation calls `revalidateTag` for the tags its change affects.
 * That is what replaces the old broad `revalidatePath("/menu")` calls, which
 * were no-ops against routes that never cached.
 */

/** Dish rows: names, prices, photos, availability, featured, ordering, specials. */
export const TAG_DISHES = "dishes";

/** Category rows and their ordering. */
export const TAG_CATEGORIES = "categories";

/** The single Settings row: name, hours, fees, contact details, currency. */
export const TAG_SETTINGS = "settings";

/** Site-wide announcement banners. */
export const TAG_ANNOUNCEMENTS = "announcements";

/** Everything the storefront renders. Used as a blunt fallback. */
export const TAG_CATALOG = "catalog";

/** All four, for a change that genuinely invalidates the whole catalog. */
export const ALL_CATALOG_TAGS = [
  TAG_DISHES,
  TAG_CATEGORIES,
  TAG_SETTINGS,
  TAG_ANNOUNCEMENTS,
  TAG_CATALOG,
] as const;
