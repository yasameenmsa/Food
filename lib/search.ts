/**
 * Search normalization.
 *
 * Arabic has no letter case, so Postgres `mode: "insensitive"` does nothing for
 * us — but it still misses orthographic variants, because أ إ آ ا and ة ه and
 * ى ي ؤ و are four, two and three distinct characters to the database
 * respectively. A customer searching "بيزا" must find "بيتزا".
 *
 * The same rules already drive URL slugs in `lib/slug.ts`, so this module
 * reuses them rather than growing a second copy of the same mapping. Anything
 * that changes a dish's searchable text must run it through `toSearchKey`.
 */

/** Alef, ya and ta-marbuta variants, plus the hamza carriers. */
type Replacer = string | ((matched: string) => string);

const LETTER_FOLD: Array<[RegExp, Replacer]> = [
  // Tashkeel and tatweel: خُبز and خبز must be one dish, not two.
  [/[\u064B-\u0652\u0640]/g, ""],
  // آ أ إ ٱ -> ا
  [/[آأإٱ]/g, "ا"],
  // ى -> ي
  [/ى/g, "ي"],
  // ة -> ه
  [/ة/g, "ه"],
  // ؤ -> و, ئ -> ي
  [/ؤ/g, "و"],
  [/ئ/g, "ي"],
  // Arabic-Indic digits to ASCII so "٤" matches "4".
  [/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660)],
];

/**
 * Folds Arabic text to a single canonical form: tashkeel removed, alef/ya/
 * ta-marbuta/hamza variants unified, Arabic-Indic digits to ASCII. Lowercases
 * and collapses whitespace.
 *
 * This is the *only* place these mappings live. `lib/slug.ts` folds through it
 * too, so a URL and a search key for the same word can never disagree.
 */
export function foldArabic(input: string): string {
  let out = input.toLowerCase();
  for (const [pattern, replacement] of LETTER_FOLD) {
    out = out.replace(pattern, replacement as string);
  }
  return out.replace(/\s+/g, " ").trim();
}

/**
 * Folds one field to its searchable form. Returns an empty string for input with
 * nothing searchable in it.
 */
export function toSearchKey(input: string | null | undefined): string {
  return input ? foldArabic(input) : "";
}

/**
 * The full key for a dish: name and description folded and joined. Searching one
 * column covers both fields, which is why the query needs no `OR`.
 */
export function dishSearchKey(
  name: string,
  description?: string | null,
): string {
  return toSearchKey(`${name} ${description ?? ""}`);
}

/**
 * The folded search terms for `q`, each as a set of LIKE patterns to OR together.
 *
 * Two things make this more than a single `contains`:
 *
 * 1. **The definite article.** Arabic speakers type "مشكله" for a dish named
 *    "المشكلة". Folding cannot bridge that — the article is a real prefix, not an
 *    orthographic variant — so each term that starts with ال also yields a variant
 *    without it. The article is trimmed from the *query* only, never from the
 *    index: stripping it on both sides would make "الزيتون" (the olive) match
 *    "زيتون" (olive) in a way that cannot be undone, and would widen every query.
 *
 * 2. **Multi-word queries.** Patterns are OR-ed per term rather than joined into
 *    one phrase. Joining them would be wrong: trimming the article from a middle
 *    term breaks contiguity, so "%بيتزا مشكله%" would not match the stored
 *    "بيتزا المشكله". OR-ing means a query only has to match *one* term, which is
 *    what a customer typing two words into a menu search expects.
 *
 * Each term yields at most two patterns, so a four-word query is eight LIKE
 * clauses. Every one is a leading-wildcard match, which a GIN trigram index can
 * serve — see `scripts/enable-search-trigram.sql`.
 *
 * `%` and `_` are escaped so a user searching for "50%" does not turn into a
 * wildcard match on everything.
 */
export function searchTerms(q: string | null | undefined): string[] {
  const terms = toSearchKey(q)
    .split(" ")
    .map((term) => term.trim())
    .filter(Boolean);

  const patterns: string[] = [];

  for (const term of terms) {
    // Leave "ال" and anything three characters or shorter alone.
    const withoutArticle =
      term.length > 3 && term.startsWith("ال") ? term.slice(2) : term;
    for (const variant of new Set([term, withoutArticle])) {
      patterns.push(`%${variant.replace(/[%_]/g, (c) => `\\${c}`)}%`);
    }
  }

  return patterns;
}
