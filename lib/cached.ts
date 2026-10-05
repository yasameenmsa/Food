/**
 * A tagged, cross-request cached read.
 *
 * The storefront used to render dynamic on every request because the shell read
 * the session cookie. With that gone, the read layer can be cached between
 * requests and dropped explicitly by `revalidateTag` when the owner saves
 * something in /admin.
 *
 * `unstable_cache` keys on the *arguments* the returned function is called with,
 * so the signature has to survive the wrapping. That is why this is a helper
 * rather than a hand-rolled `cache(() => unstable_cache(...))` at each call site:
 * the arrow returns the cached function instead of calling it, which silently
 * changes the caller's type from `Promise<T>` to `() => Promise<T>`.
 *
 *   export const getDishBySlug = tagged(async (slug: string) => ..., [TAG_DISHES]);
 */
import { cache } from "react";
import { unstable_cache } from "next/cache";

export function tagged<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  tags: readonly string[],
) {
  // `cache` deduplicates within a single request; `unstable_cache` holds the
  // value across requests until one of `tags` is revalidated.
  //
  // Signature note: the second positional argument is `keyParts`, and the tags
  // live in the third argument's options object. Passing tags as the second
  // argument type-checks as `string[]` and then silently tags nothing.
  return cache(unstable_cache(fn, [], { tags: [...tags] }));
}
