import Link from "next/link";
import { Container } from "@/components/atoms/Layout";
import { Chip } from "@/components/atoms/Badge";
import { SearchBar } from "@/components/molecules/SearchBar";
import { CategoryLink } from "@/components/molecules/NavItem";
import type { CategoryDTO } from "@/types";

/** Base path the filters link against; `/menu` is the only menu view. */
const BASE = "/menu";

function withQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `${BASE}?${query}` : BASE;
}

export type MenuToolbarProps = {
  categories: CategoryDTO[];
  activeCategoryId?: string;
  query: string;
  page: number;
  total: number;
};

/**
 * Search, category rail and result count. Everything writes to the URL, so the
 * whole view is linkable and the back button walks the filter history.
 */
export function MenuToolbar({
  categories,
  activeCategoryId,
  query,
  page,
  total,
}: MenuToolbarProps) {
  const allCategories = [{ id: "", name: "الكل" }, ...categories];

  return (
    <div className="space-y-5">
      <SearchBar initialValue={query} />

      {/* Horizontal rail on phones, sticky sidebar from `lg`. Both render the
          same links so keyboard order stays sane. */}
      <nav aria-label="أقسام القائمة" className="lg:hidden">
        <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {allCategories.map((category) => (
            <li key={category.id || "all"} className="shrink-0">
              <Link
                href={withQuery({
                  category: category.id || undefined,
                  q: query || undefined,
                })}
                aria-current={activeCategoryId === (category.id || undefined) ? "page" : undefined}
                className={[
                  "inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full border-2 px-4 font-semibold transition-colors",
                  activeCategoryId === (category.id || undefined)
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-line bg-surface text-brand hover:border-brand",
                ].join(" ")}
              >
                {category.name}
                {"dishCount" in category ? (
                  <span className="nums text-xs opacity-80">{category.dishCount}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p className="text-sm text-muted" aria-live="polite">
        <span className="nums">{total}</span>{" "}
        {total === 1 ? "صنف متاح" : total === 2 ? "صنفان متاحان" : "أصناف متاحة"}
        {page > 1 ? (
          <>
            {" "}
            — الصفحة <span className="nums">{page}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}

/** The same category list as the rail, as a sidebar for large screens. */
export function CategorySidebar({
  categories,
  activeCategoryId,
  query,
}: {
  categories: CategoryDTO[];
  activeCategoryId?: string;
  query: string;
}) {
  return (
    <nav aria-label="أقسام القائمة" className="hidden lg:block">
      <h2 className="font-display text-xl">الأقسام</h2>
      <ul className="mt-4 flex flex-col gap-1">
        <li>
          <CategoryLink
            href={withQuery({ q: query || undefined })}
            label="الكل"
            active={!activeCategoryId}
          />
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <CategoryLink
              href={withQuery({ category: category.id, q: query || undefined })}
              label={category.name}
              count={category.dishCount}
              active={activeCategoryId === category.id}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Active-filter chips with an "×" each, plus a reset. */
export function ActiveFilters({
  categories,
  activeCategoryId,
  query,
}: {
  categories: CategoryDTO[];
  activeCategoryId?: string;
  query: string;
}) {
  const activeCategory = categories.find((category) => category.id === activeCategoryId);
  const hasFilters = Boolean(activeCategoryId || query);
  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {query ? (
        <Chip href={withQuery({ category: activeCategoryId })}>
          بحث: <span className="nums">{query}</span>
        </Chip>
      ) : null}
      {activeCategory ? (
        <Chip href={withQuery({ q: query || undefined })}>{activeCategory.name}</Chip>
      ) : null}
      <Link
        href={BASE}
        className="text-sm font-bold text-brand underline underline-offset-4"
      >
        مسح الكل
      </Link>
    </div>
  );
}

export { Container };
