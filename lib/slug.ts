/**
 * URL slugs for dishes.
 *
 * Menu items are named in Arabic, and there is no reliable way to transliterate
 * that into Latin by hand, so `slugify` keeps Arabic letters (they survive
 * percent-encoding in a path segment). Owners who want a Latin slug type one in
 * /admin and it wins.
 */

const ARABIC_DIACRITICS = /[\u064B-\u0652\u0640]/g;

/** Strips Arabic tashkeel so خُبز and خبز do not become two different URLs. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[آأإ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Keeps the caller's slug if it has real content, otherwise derives one from the
 * name. Returns an empty string when nothing usable is left, which the admin
 * form reports as a validation error.
 */
export function resolveSlug(name: string, provided?: string | null): string {
  const explicit = slugify(provided ?? "");
  return explicit || slugify(name);
}