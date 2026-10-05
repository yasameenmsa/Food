"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ImageDTO } from "@/types";

export type CartLine = {
  dishId: string;
  slug: string;
  name: string;
  image: ImageDTO | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

const STORAGE_KEY = "zaytona:cart:v1";

type CartValue = {
  lines: CartLine[];
  subtotal: number;
  count: number;
  /** False until localStorage has been read, so SSR and first paint agree. */
  ready: boolean;
  add: (line: Omit<CartLine, "lineTotal" | "quantity">, quantity?: number) => void;
  setQuantity: (dishId: string, quantity: number) => void;
  remove: (dishId: string) => void;
  clear: () => void;
  /** Price of a dish already in the cart, or null. Lets cards say "في السلة". */
  quantityOf: (dishId: string) => number;
};

const CartContext = createContext<CartValue | null>(null);

function read(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is CartLine =>
        typeof line === "object" &&
        line !== null &&
        typeof (line as CartLine).dishId === "string" &&
        typeof (line as CartLine).quantity === "number" &&
        (line as CartLine).quantity > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(read());
    setReady(true);
  }, []);

  // Persist after hydration only, so an empty server render never wipes a cart.
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Private mode or a full quota: the cart still works for this session.
    }
  }, [lines, ready]);

  // Keep tabs in sync — the WhatsApp link and the checkout form both read it.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setLines(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((line: Omit<CartLine, "lineTotal" | "quantity">, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((item) => item.dishId === line.dishId);
      if (existing) {
        return current.map((item) => {
          if (item.dishId !== line.dishId) return item;
          const nextQuantity = Math.min(99, item.quantity + quantity);
          return { ...item, quantity: nextQuantity, lineTotal: item.unitPrice * nextQuantity };
        });
      }
      const nextQuantity = Math.min(99, Math.max(1, quantity));
      return [
        ...current,
        { ...line, quantity: nextQuantity, lineTotal: line.unitPrice * nextQuantity },
      ];
    });
  }, []);

  const setQuantity = useCallback((dishId: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((item) => item.dishId !== dishId)
        : current.map((item) =>
            item.dishId === dishId
              ? {
                  ...item,
                  quantity: Math.min(99, quantity),
                  lineTotal: item.unitPrice * Math.min(99, quantity),
                }
              : item,
          ),
    );
  }, []);

  const remove = useCallback((dishId: string) => {
    setLines((current) => current.filter((item) => item.dishId !== dishId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(() => {
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    return {
      lines,
      subtotal,
      count,
      ready,
      add,
      setQuantity,
      remove,
      clear,
      quantityOf: (dishId) => lines.find((item) => item.dishId === dishId)?.quantity ?? 0,
    };
  }, [lines, ready, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside <CartProvider>");
  return value;
}