import { formatMoney } from "@/lib/money";
import { Icon } from "@/components/atoms/Icon";
import { Numeral } from "@/components/atoms/Typography";

export type PriceTagProps = {
  /** Agorot actually charged. */
  price: number;
  /** Agorot before the discount, when there is one. */
  originalPrice?: number | null;
  currency?: string;
  size?: "sm" | "md" | "lg";
};

/**
 * Shows the saving as a percentage as well as the old price struck through, so
 * the discount is never communicated by colour alone.
 */
export function PriceTag({
  price,
  originalPrice = null,
  currency = "₪",
  size = "md",
}: PriceTagProps) {
  const discounted = originalPrice !== null && originalPrice > price;
  const percent = discounted ? Math.round((1 - price / originalPrice!) * 100) : 0;

  const priceSize = { sm: "text-base", md: "text-xl", lg: "text-3xl" }[size];
  const oldSize = { sm: "text-xs", md: "text-sm", lg: "text-lg" }[size];

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Numeral className={`font-bold text-gold ${priceSize}`}>
        {formatMoney(price, currency)}
      </Numeral>

      {discounted ? (
        <>
          <Numeral className={`text-muted line-through ${oldSize}`}>
            {formatMoney(originalPrice!, currency)}
          </Numeral>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-brown">
            <Icon name="flame" size={12} />
            <Numeral>-{percent}%</Numeral>
          </span>
        </>
      ) : null}
    </div>
  );
}