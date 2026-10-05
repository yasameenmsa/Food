import Link from "next/link";
import { Icon } from "@/components/atoms/Icon";

export type PaginationProps = {
  page: number;
  pageCount: number;
  /** Absolute path to link to, e.g. "/menu". */
  basePath: string;
  /** Current filters, preserved across pages. */
  params?: Record<string, string | undefined>;
};

/** Keeps existing filters while changing only `page`. */
function href(basePath: string, params: PaginationProps["params"], page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) search.set(key, value);
  }
  search.set("page", String(page));
  return `${basePath}?${search.toString()}`;
}

export function Pagination({ page, pageCount, basePath, params }: PaginationProps) {
  if (pageCount <= 1) return null;

  // A short window around the current page, always including first and last.
  const pages: (number | "gap")[] = [];
  const window = 1;
  for (let index = 1; index <= pageCount; index += 1) {
    const inWindow = Math.abs(index - page) <= window;
    const isEdge = index === 1 || index === pageCount;
    if (inWindow || isEdge) {
      pages.push(index);
    } else if (pages[pages.length - 1] !== "gap") {
      pages.push("gap");
    }
  }

  const arrowButton =
    "inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-card border-2 border-line bg-surface px-3 font-bold text-brand transition-colors hover:border-brand disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav aria-label="تصفّح الصفحات" className="mt-10 flex justify-center">
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          {page > 1 ? (
            <Link
              href={href(basePath, params, page - 1)}
              rel="prev"
              aria-label="الصفحة السابقة"
              className={arrowButton}
            >
              <Icon name="chevronRight" size={18} />
              <span className="hidden sm:inline">السابق</span>
            </Link>
          ) : (
            <span aria-disabled className={arrowButton}>
              <Icon name="chevronRight" size={18} />
              <span className="hidden sm:inline">السابق</span>
            </span>
          )}
        </li>

        {pages.map((entry, index) =>
          entry === "gap" ? (
            <li key={`gap-${index}`} className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={entry}>
              <Link
                href={href(basePath, params, entry)}
                aria-current={entry === page ? "page" : undefined}
                aria-label={`الصفحة ${entry}`}
                className={[
                  "inline-flex h-11 min-w-11 items-center justify-center rounded-card border-2 px-3 font-bold transition-colors",
                  entry === page
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-line bg-surface text-brand hover:border-brand",
                ].join(" ")}
              >
                <span className="nums">{entry}</span>
              </Link>
            </li>
          ),
        )}

        <li>
          {page < pageCount ? (
            <Link
              href={href(basePath, params, page + 1)}
              rel="next"
              aria-label="الصفحة التالية"
              className={arrowButton}
            >
              <span className="hidden sm:inline">التالي</span>
              <Icon name="chevronLeft" size={18} />
            </Link>
          ) : (
            <span aria-disabled className={arrowButton}>
              <span className="hidden sm:inline">التالي</span>
              <Icon name="chevronLeft" size={18} />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}