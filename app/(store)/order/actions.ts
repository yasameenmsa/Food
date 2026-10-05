"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { describeNextChange, getOpenState } from "@/lib/hours";
import { getSettings } from "@/lib/settings";
import { getDishesByIds } from "@/lib/dishes";
import { createOrder } from "@/lib/orders";
import { normalizePhone } from "@/lib/whatsapp";
import type { CartLineDTO, FormState } from "@/types";

/**
 * Parses `dishId:quantity,dishId:quantity`. Returns `null` on anything malformed
 * rather than throwing, so a hand-edited form field degrades into a validation
 * error instead of a 500.
 */
function parseLines(raw: string): { dishId: string; quantity: number }[] | null {
  const pairs = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (pairs.length === 0) return null;

  const merged = new Map<string, number>();
  for (const pair of pairs) {
    const [dishId, rawQuantity] = pair.split(":");
    if (!dishId || !rawQuantity) return null;
    const quantity = Number.parseInt(rawQuantity, 10);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return null;
    merged.set(dishId, Math.min(99, (merged.get(dishId) ?? 0) + quantity));
  }

  return [...merged].map(([dishId, quantity]) => ({ dishId, quantity }));
}

export async function submitOrder(formData: FormData): Promise<FormState> {
  const parsed = parseLines(String(formData.get("lines") ?? ""));
  if (!parsed) {
    return { ok: false, message: "السلة غير صالحة. أعد تحميل الصفحة وحاول مجددًا." };
  }

  const settings = await getSettings();
  const errors: Record<string, string> = {};

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) errors.name = "أدخل اسمك.";
  if (name.length > 80) errors.name = "الاسم طويل جدًا.";

  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (phone.length < 9) errors.phone = "أدخل رقم هاتف صحيح.";

  const type = String(formData.get("type") ?? "delivery") === "pickup" ? "PICKUP" : "DELIVERY";

  const address = String(formData.get("address") ?? "").trim();
  if (type === "DELIVERY" && address.length < 5) {
    errors.address = "العنوان مطلوب لطلبات التوصيل.";
  }

  const notes = String(formData.get("notes") ?? "").trim().slice(0, 500);

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "راجع الحقول المميزة.", errors };
  }

  // Reject orders outside the kitchen's own hours rather than silently taking
  // money for food nobody is making.
  const now = new Date();
  if (!getOpenState(settings.orderingHours, now, settings.timezone).isOpen) {
    return {
      ok: false,
      message: describeNextChange(settings.orderingHours, now, settings.timezone, "kitchen"),
    };
  }

  // Names, prices and availability are re-read from the database. The browser
  // only ever says *what* was ordered.
  const dishes = await getDishesByIds(parsed.map((line) => line.dishId));
  const byId = new Map(dishes.map((dish) => [dish.id, dish]));

  const lines: CartLineDTO[] = [];
  for (const requested of parsed) {
    const dish = byId.get(requested.dishId);
    if (!dish) {
      return { ok: false, message: "أحد الأصناف لم يعد موجودًا. حدّث السلة وحاول مجددًا." };
    }
    if (!dish.available) {
      return { ok: false, message: `«${dish.name}» غير متوفر حاليًا.` };
    }
    lines.push({
      dishId: dish.id,
      slug: dish.slug,
      name: dish.name,
      image: dish.image,
      unitPrice: dish.currentPrice,
      quantity: requested.quantity,
      lineTotal: dish.currentPrice * requested.quantity,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  if (settings.minOrder > 0 && subtotal < settings.minOrder) {
    return { ok: false, message: "لم تصل إلى الحد الأدنى للطلب بعد." };
  }

  const order = await createOrder({
    type,
    customerName: name,
    phone,
    address: type === "DELIVERY" ? address : null,
    notes: notes || null,
    lines,
    fee: type === "DELIVERY" ? settings.deliveryFee : 0,
  });

  revalidatePath("/admin");

  // The success page reads the reference from the URL, so a refresh is safe and
  // the customer's back button still returns to a live cart.
  redirect(`/order/${order.reference}`);
}
