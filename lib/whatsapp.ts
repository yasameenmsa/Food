/**
 * WhatsApp is the ordering channel: the site builds a prefilled message and
 * hands the customer to wa.me. The owner then confirms in WhatsApp, which is why
 * `Order.whatsappSent` starts false.
 */
import { whatsappDigits, whatsappLink } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import type { CartLineDTO } from "@/types";

export type OrderKind = "delivery" | "pickup";

export function dishLink(slug: string, origin: string): string {
  return `${origin}/menu/${slug}`;
}

/** "I'd like to order X" — two taps from a card to a started conversation. */
export function dishMessage(
  dish: { name: string; price: number },
  url: string,
  currency: string,
): string {
  return [
    `السلام عليكم، أود طلب ${dish.name}`,
    `السعر: ${formatMoney(dish.price, currency)}`,
    `الرابط: ${url}`,
  ].join("\n");
}

/** The full order, itemised, ready to paste into the chat. */
export function orderMessage(input: {
  reference: string;
  kind: OrderKind;
  customerName: string;
  phone: string;
  address: string | null;
  notes: string | null;
  lines: CartLineDTO[];
  subtotal: number;
  fee: number;
  total: number;
  currency: string;
}): string {
  const items = input.lines
    .map((line, index) => {
      const name = `${index + 1}. ${line.name}`;
      const qty = `× ${line.quantity}`;
      const sum = formatMoney(line.lineTotal, input.currency);
      return `${name} — ${qty} — ${sum}`;
    })
    .join("\n");

  const kindLabel = input.kind === "delivery" ? "توصيل" : "استلام من المحل";

  return [
    `طلب جديد — ${input.reference}`,
    "",
    `الاسم: ${input.customerName}`,
    `الهاتف: ${input.phone}`,
    `النوع: ${kindLabel}`,
    ...(input.kind === "delivery" && input.address ? [`العنوان: ${input.address}`] : []),
    ...(input.notes ? [`ملاحظات: ${input.notes}`] : []),
    "",
    "الأصناف:",
    items,
    "",
    `المجموع: ${formatMoney(input.subtotal, input.currency)}`,
    ...(input.fee > 0 ? [`رسوم التوصيل: ${formatMoney(input.fee, input.currency)}`] : []),
    `الإجمالي: ${formatMoney(input.total, input.currency)}`,
  ].join("\n");
}

export function orderWhatsappLink(whatsapp: string, message: string): string {
  return whatsappLink(whatsapp, message);
}

/** Strips formatting so a number typed as "+970 59 811 2233" matches. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0")) return `+97${digits.slice(1)}`;
  return digits ? `+${digits}` : "";
}

export { whatsappDigits, whatsappLink };