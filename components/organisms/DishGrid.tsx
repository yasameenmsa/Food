import NextLink from "next/link";
import type { DishDTO } from "@/types";
import { DishCard } from "./DishCard";
import { Icon } from "@/components/atoms/Icon";
import { buttonStyles } from "@/components/atoms/Button";

export type DishGridProps = {
  dishes: DishDTO[];
  currency?: string;
  /** Builds the wa.me link per dish. Omit to render cards without order buttons. */
  whatsappHrefFor?: (dish: DishDTO) => string | undefined;
  /** Shown instead of the grid when there is nothing to list. */
  emptyMessage?: string;
  emptyAction?: { href: string; label: string };
  sizes?: string;
  priorityFirst?: boolean;
};

/** 2 columns on a phone, 3 from `md`, 4 on `xl` — per FRONTEND_PLAN §3. */
export function DishGrid({
  dishes,
  currency = "₪",
  whatsappHrefFor,
  emptyMessage = "لا توجد أصناف مطابقة.",
  emptyAction = { href: "/menu", label: "تصفّح القائمة كاملة" },
  sizes,
  priorityFirst = false,
}: DishGridProps) {
  if (dishes.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface px-6 py-16 text-center">
        <Icon name="utensils" size={40} className="mx-auto text-olive/30" />
        <p className="mt-4 text-lg font-bold">{emptyMessage}</p>
        <NextLink href={emptyAction.href} className={`${buttonStyles("secondary", "md")} mt-6`}>
          {emptyAction.label}
        </NextLink>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {dishes.map((dish, index) => (
        <li key={dish.id} className="flex">
          <DishCard
            dish={dish}
            currency={currency}
            whatsappHref={whatsappHrefFor?.(dish)}
            sizes={sizes}
            priority={priorityFirst && index < 4}
          />
        </li>
      ))}
    </ul>
  );
}