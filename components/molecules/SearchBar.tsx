"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/atoms/Icon";

const DEBOUNCE_MS = 300;

export type SearchBarProps = {
  initialValue?: string;
  placeholder?: string;
};

/**
 * Search lives in the URL (`?q=`) so a filtered menu is shareable and the back
 * button behaves. Typing is debounced to keep the router quiet.
 */
export function SearchBar({
  initialValue = "",
  placeholder = "ابحث عن صنف…",
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  // Keep in sync when the URL changes from outside (back button, chip click).
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (value === initialValue) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (value.trim()) params.set("q", value.trim());
      // Any new search invalidates the current page number.
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, initialValue, pathname, router]);

  return (
    <search className="relative">
      <label htmlFor="menu-search" className="sr-only">
        {placeholder}
      </label>
      <Icon
        name="search"
        size={20}
        className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        id="menu-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-busy={isPending || undefined}
        className="h-12 w-full rounded-card border-2 border-line bg-surface ps-12 pe-12 text-base placeholder:text-muted/70 focus:border-brand"
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="مسح البحث"
          className="absolute end-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-stone/40 hover:text-brand"
        >
          <Icon name="close" size={18} />
        </button>
      ) : null}
    </search>
  );
}