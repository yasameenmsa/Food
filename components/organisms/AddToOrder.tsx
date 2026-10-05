"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { QuantityStepper } from "@/components/molecules/QuantityStepper";
import { useCart } from "@/components/molecules/cart-context";
import type { DishDTO } from "@/types";

/**
 * Dish-page order panel. Adds to the local cart; the real price is re-read on
 * the server at checkout, so a tampered localStorage cannot change a total.
 */
export function AddToOrder({ dish, currency }: { dish: DishDTO; currency: string }) {
  const { add, ready, quantityOf } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const inCart = ready ? quantityOf(dish.id) : 0;

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 2500);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const handleAdd = () => {
    add(
      {
        dishId: dish.id,
        slug: dish.slug,
        name: dish.name,
        image: dish.image,
        unitPrice: dish.currentPrice,
      },
      quantity,
    );
    setJustAdded(true);
  };

  if (!dish.available) {
    return (
      <div className="rounded-card border-2 border-danger/40 bg-danger/10 px-4 py-3 font-semibold text-danger">
        هذا الصنف غير متوفر اليوم.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={20}
          label="الكمية"
        />

        <Button size="lg" onClick={handleAdd}>
          <Icon name="cart" size={20} />
          أضف إلى السلة
        </Button>
      </div>

      {justAdded ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-card border-2 border-success/40 bg-success/10 px-4 py-3 font-semibold text-success"
        >
          <Icon name="check" size={18} />
          أُضيف إلى السلة{inCart ? ` — لديك ${inCart} من هذا الصنف` : ""}.
        </p>
      ) : null}

      {inCart > 0 && !justAdded ? (
        <p className="text-sm text-muted">
          في سلّتك الآن <span className="nums">{inCart}</span> من هذا الصنف.
        </p>
      ) : null}
    </div>
  );
}