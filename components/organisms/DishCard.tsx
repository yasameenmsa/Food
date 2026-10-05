import Link from "next/link";
import { Badge } from "@/components/atoms/Badge";
import { Icon } from "@/components/atoms/Icon";
import { PriceTag } from "@/components/molecules/PriceTag";
import { DishImage } from "@/components/molecules/DishImage";
import type { DishDTO } from "@/types";

export type DishCardProps = {
  dish: DishDTO;
  currency?: string;
  /** Prebuilt wa.me link, or omit to hide the order button. */
  whatsappHref?: string;
  sizes?: string;
  priority?: boolean;
};

export function DishCard({
  dish,
  currency = "₪",
  whatsappHref,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
}: DishCardProps) {
  return (
    <article
      className={[
        "group flex w-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-brand",
        "transition-shadow duration-200 hover:shadow-lift",
        dish.available ? "" : "opacity-70",
      ].join(" ")}
    >
      <Link
        href={`/menu/${dish.slug}`}
        className="relative block overflow-hidden"
        tabIndex={-1}
        aria-hidden
      >
        <DishImage
          image={dish.image}
          name={dish.name}
          sizes={sizes}
          priority={priority}
          className="transition-transform duration-300 motion-reduce:transform-none group-hover:scale-105"
        />
        {dish.special ? (
          <span className="absolute start-3 top-3">
            <Badge tone="accent">
              <Icon name="flame" size={12} />
              {dish.special.label ?? "عرض"}
            </Badge>
          </span>
        ) : null}
        {!dish.available ? (
          <span className="absolute end-3 top-3">
            <Badge tone="danger">غير متوفر اليوم</Badge>
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold leading-snug">
            <Link href={`/menu/${dish.slug}`} className="link-underline decoration-1 underline-offset-4">
              {dish.name}
            </Link>
          </h3>
        </div>

        <p className="text-xs font-semibold text-muted">{dish.categoryName}</p>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
          <PriceTag
            price={dish.currentPrice}
            originalPrice={dish.special ? dish.price : null}
            currency={currency}
          />

          {whatsappHref && dish.available ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`اطلب ${dish.name} عبر واتساب`}
              className="inline-flex h-11 items-center gap-2 rounded-card bg-brand px-4 font-bold text-brand-foreground transition-colors hover:bg-accent"
            >
              <Icon name="whatsapp" size={18} />
              اطلب
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}