"use client";

import Link from "next/link";
import { Button, buttonStyles } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { QuantityStepper } from "@/components/molecules/QuantityStepper";
import { PriceTag } from "@/components/molecules/PriceTag";
import { DishImage } from "@/components/molecules/DishImage";
import { useCart } from "@/components/molecules/cart-context";
import type { CartLine } from "@/components/molecules/cart-context";

export type CartViewProps = {
  currency: string;
  deliveryFee: number;
  minOrder: number;
};

function LineRow({
  line,
  currency,
  onSetQuantity,
  onRemove,
}: {
  line: CartLine;
  currency: string;
  onSetQuantity: (dishId: string, quantity: number) => void;
  onRemove: (dishId: string) => void;
}) {
  return (
    <li className="flex gap-4 border-b border-line py-4 last:border-b-0">
      <Link href={`/menu/${line.slug}`} className="size-24 shrink-0 overflow-hidden rounded-card">
        <DishImage image={line.image} name={line.name} sizes="96px" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/menu/${line.slug}`}
            className="link-underline font-bold leading-snug underline-offset-4"
          >
            {line.name}
          </Link>
          <button
            type="button"
            onClick={() => onRemove(line.dishId)}
            aria-label={`إزالة ${line.name} من السلة`}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-stone/40 hover:text-danger"
          >
            <Icon name="trash" size={18} />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <QuantityStepper
            size="sm"
            value={line.quantity}
            onChange={(quantity) => onSetQuantity(line.dishId, quantity)}
            label={line.name}
            hideLabel
          />
          <PriceTag price={line.lineTotal} currency={currency} size="sm" />
        </div>
      </div>
    </li>
  );
}

export function CartView({ currency, deliveryFee, minOrder }: CartViewProps) {
  const { lines, subtotal, count, ready, setQuantity, remove, clear } = useCart();

  if (!ready) {
    return (
      <div className="rounded-lg border border-line bg-surface p-8 text-center text-muted">
        <Icon name="cart" size={32} className="mx-auto opacity-40" />
        <p className="mt-3">جارٍ تحميل سلّتك…</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface p-8 text-center md:p-16">
        <Icon name="cart" size={40} className="mx-auto text-olive/30" />
        <p className="mt-4 text-lg font-bold">سلّتك فارغة</p>
        <p className="mt-1 text-muted">ابدأ بإضافة أصنافك المفضّلة من القائمة.</p>
        <Link href="/menu" className={`${buttonStyles("primary", "lg")} mt-6`}>
          <Icon name="utensils" size={20} />
          تصفّح القائمة
        </Link>
      </div>
    );
  }

  const total = subtotal + deliveryFee;
  const belowMinimum = subtotal < minOrder;
  const remaining = minOrder - subtotal;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="rounded-lg border border-line bg-surface px-5 shadow-brand">
        <ul>
          {lines.map((line) => (
            <LineRow
              key={line.dishId}
              line={line}
              currency={currency}
              onSetQuantity={setQuantity}
              onRemove={remove}
            />
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-lg border border-line bg-surface p-5 shadow-brand lg:sticky lg:top-20">
        <h2 className="font-display text-xl">ملخّص الطلب</h2>

        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt>
              المجموع (<span className="nums">{count}</span> قطعة)
            </dt>
            <dd>
              <PriceTag price={subtotal} currency={currency} size="sm" />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>رسوم التوصيل</dt>
            <dd>
              <PriceTag price={deliveryFee} currency={currency} size="sm" />
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
            <dt>الإجمالي</dt>
            <dd>
              <PriceTag price={total} currency={currency} />
            </dd>
          </div>
        </dl>

        {belowMinimum ? (
          <p
            role="status"
            className="mt-4 rounded-card border-2 border-warning/40 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning"
          >
            الحد الأدنى للطلب <PriceTag price={minOrder} currency={currency} size="sm" /> —
            ينقصك <PriceTag price={remaining} currency={currency} size="sm" />.
          </p>
        ) : null}

        <Link
          href="/order"
          aria-disabled={belowMinimum}
          className={`${buttonStyles("primary", "lg")} mt-5 w-full ${
            belowMinimum ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <Icon name="check" size={20} />
          متابعة الطلب
        </Link>

        <Link href="/menu" className={`${buttonStyles("ghost", "md")} mt-2 w-full`}>
          أضف أصنافًا أخرى
        </Link>

        <Button variant="ghost" size="sm" onClick={clear} className="mt-2 w-full">
          <Icon name="trash" size={16} />
          إفراغ السلة
        </Button>
      </aside>
    </div>
  );
}
