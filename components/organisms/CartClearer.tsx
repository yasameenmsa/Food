"use client";

import { useEffect } from "react";
import { useCart } from "@/components/molecules/cart-context";

/**
 * Empties the cart once an order exists.
 *
 * This runs on the confirmation page rather than in the checkout action, because
 * the action ends in a `redirect()` — mutating storage there would race the
 * navigation and a failed navigation would lose the cart.
 */
export function CartClearer() {
  const { clear } = useCart();

  useEffect(() => {
    clear();
  }, [clear]);

  return null;
}
