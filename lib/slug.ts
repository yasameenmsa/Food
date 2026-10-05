/**
 * URL slugs for dishes.
 *
 * Menu items are named in Arabic, and there is no reliable way to transliterate
 * that into Latin by hand, so slugs keep Arabic letters (they survive
 * percent-encoding in a path segment). Owners who want a Latin slug type one in
 * /admin and it wins.
 *
 * The character folding is not defined here — it lives in `lib/search.ts` so a
 * URL and a search key for the same word can never disagree.
 */
import { foldArabic } from "./search";

/**
 * Strips Arabic tashkeel so خُبز and خبز do not become two different URLs, then
 * replaces every run of non-alphanumeric characters with a single dash.
 */
export function slugify(input: string): string {
  return foldArabic(input)
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
