"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { parseAgorot } from "@/lib/money";
import { resolveSlug } from "@/lib/slug";
import { parseHours, isValidTime } from "@/lib/hours";
import { setOrderStatus, markWhatsappSent } from "@/lib/orders";
import { ORDER_STATUS_VALUES } from "@/lib/order-status";
import type { FormState, OrderStatus } from "@/types";

/** Every admin mutation re-checks the session; never trust the route guard alone. */
async function guard(path: string) {
  await requireSession(path);
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return value.length > 0 ? value : null;
}

/* ------------------------------------------------------------------ orders */

export async function updateOrderStatus(formData: FormData): Promise<void> {
  await guard("/admin");

  const id = text(formData, "id");
  const status = text(formData, "status") as OrderStatus;

  if (!id || !ORDER_STATUS_VALUES.includes(status)) return;

  await setOrderStatus(id, status);
  revalidatePath("/admin");
}

export async function flagWhatsappSent(formData: FormData): Promise<void> {
  await guard("/admin");

  const id = text(formData, "id");
  if (!id) return;

  await markWhatsappSent(id);
  revalidatePath("/admin");
}

/* ------------------------------------------------------------------ dishes */

export type DishFormState = FormState & { slug?: string };

export async function saveDish(
  _previous: DishFormState,
  formData: FormData,
): Promise<DishFormState> {
  await guard("/admin/dishes");

  const id = optional(formData, "id");
  const name = text(formData, "name");
  const categoryId = text(formData, "categoryId");
  const errors: Record<string, string> = {};

  if (name.length < 2) errors.name = "أدخل اسم الصنف.";
  if (!categoryId) errors.categoryId = "اختر قسمًا.";

  const price = parseAgorot(text(formData, "price"));
  if (price === null || price <= 0) errors.price = "أدخل سعرًا صحيحًا.";

  const offerRaw = text(formData, "offerPrice");
  let offerPrice: number | null = null;
  if (offerRaw) {
    const parsed = parseAgorot(offerRaw);
    if (parsed === null || parsed <= 0) {
      errors.offerPrice = "السعر المخفّض غير صحيح.";
    } else if (price !== null && parsed >= price) {
      errors.offerPrice = "السعر المخفّض يجب أن يكون أقل من السعر الأصلي.";
    } else {
      offerPrice = parsed;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "راجع الحقول المميزة.", errors };
  }

  const slug = resolveSlug(name, optional(formData, "slug"));

  const data = {
    name,
    slug,
    categoryId,
    description: optional(formData, "description"),
    price: price!,
    offerPrice,
    available: formData.get("available") === "on",
    featured: formData.get("featured") === "on",
  };

  if (id) {
    // A slug can collide with another dish if the name is changed to a duplicate.
    const clash = await prisma.dish.findUnique({ where: { slug }, select: { id: true } });
    if (clash && clash.id !== id) {
      return { ok: false, message: "هذا الرابط محجوز لصنف آخر.", errors: { slug: "الرابط مستخدم." } };
    }
    await prisma.dish.update({ where: { id }, data });
  } else {
    await prisma.dish.create({ data });
  }

  revalidatePath("/admin/dishes");
  revalidatePath("/menu");
  revalidatePath("/");
  return { ok: true, message: "تم الحفظ." };
}

export async function deleteDish(formData: FormData): Promise<void> {
  await guard("/admin/dishes");

  const id = text(formData, "id");
  if (!id) return;

  // OrderItem.dishId is nullable with onDelete: SetNull, so history survives.
  await prisma.dish.delete({ where: { id } });

  revalidatePath("/admin/dishes");
  revalidatePath("/menu");
  revalidatePath("/");
  redirect("/admin/dishes");
}

export async function toggleDishAvailability(formData: FormData): Promise<void> {
  await guard("/admin/dishes");

  const id = text(formData, "id");
  if (!id) return;

  const dish = await prisma.dish.findUnique({ where: { id }, select: { available: true } });
  if (!dish) return;

  await prisma.dish.update({ where: { id }, data: { available: !dish.available } });
  revalidatePath("/admin/dishes");
  revalidatePath("/menu");
}

export async function saveSpecial(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await guard("/admin/dishes");

  const dishId = text(formData, "dishId");
  const offerPrice = parseAgorot(text(formData, "offerPrice"));
  const errors: Record<string, string> = {};

  if (!dishId) errors.dishId = "اختر صنفًا.";
  if (offerPrice === null || offerPrice <= 0) errors.offerPrice = "أدخل سعرًا صحيحًا.";

  const dateValue = optional(formData, "expiresAt");
  let expiresAt: Date | null = null;
  if (dateValue) {
    expiresAt = new Date(dateValue);
    if (Number.isNaN(expiresAt.getTime())) errors.expiresAt = "تاريخ غير صحيح.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "راجع الحقول المميزة.", errors };
  }

  await prisma.special.create({
    data: {
      dishId,
      offerPrice: offerPrice!,
      label: optional(formData, "label"),
      expiresAt,
      active: true,
    },
  });

  revalidatePath("/admin/dishes");
  revalidatePath("/specials");
  revalidatePath("/menu");
  return { ok: true, message: "أُضيف العرض." };
}

export async function endSpecial(formData: FormData): Promise<void> {
  await guard("/admin/dishes");

  const id = text(formData, "id");
  if (!id) return;

  // Deactivate rather than delete: past orders keep their historical price.
  await prisma.special.update({ where: { id }, data: { active: false } });

  revalidatePath("/admin/dishes");
  revalidatePath("/specials");
  revalidatePath("/menu");
}

/* -------------------------------------------------------------- categories */

export async function saveCategory(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await guard("/admin/dishes");

  const name = text(formData, "name");
  if (name.length < 2) {
    return { ok: false, message: "أدخل اسم القسم.", errors: { name: "اسم القسم مطلوب." } };
  }

  const existing = await prisma.category.findMany({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  const id = text(formData, "id");

  if (existing.length > 0 && existing[0].id !== id) {
    return { ok: false, message: "يوجد قسم بنفس الاسم.", errors: { name: "الاسم مستخدم." } };
  }

  if (id) {
    await prisma.category.update({ where: { id }, data: { name } });
  } else {
    await prisma.category.create({ data: { name } });
  }

  revalidatePath("/admin/dishes");
  revalidatePath("/menu");
  return { ok: true, message: "تم الحفظ." };
}

/* -------------------------------------------------------------- settings */

const WEEK = [0, 1, 2, 3, 4, 5, 6] as const;

/**
 * The two hour sets share a form: for each day the shop window is `open[i]`/
 * `close[i]`, and the kitchen window is `orderOpen[i]`/`orderClose[i]`. A day
 * with no times is closed, which `parseHours` turns into `null`.
 */
function readHours(formData: FormData) {
  const shop: Record<string, unknown> = {};
  const kitchen: Record<string, unknown> = {};

  for (const day of WEEK) {
    const read = (prefix: string) => ({
      open: text(formData, `${prefix}Open[${day}]`),
      close: text(formData, `${prefix}Close[${day}]`),
    });

    const { open, close } = read("");
    shop[String(day)] =
      open && close && isValidTime(open) && isValidTime(close) ? { open, close } : null;

    const order = read("order");
    kitchen[String(day)] =
      order.open && order.close && isValidTime(order.open) && isValidTime(order.close)
        ? { open: order.open, close: order.close }
        : null;
  }

  return { openingHours: parseHours(shop), orderingHours: parseHours(kitchen) };
}

export async function saveSettings(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await guard("/admin/settings");

  const name = text(formData, "name");
  const address = text(formData, "address");
  const whatsapp = text(formData, "whatsapp");
  const errors: Record<string, string> = {};

  if (name.length < 2) errors.name = "أدخل اسم المحل.";
  if (address.length < 3) errors.address = "أدخل العنوان.";
  if (whatsapp.replace(/\D/g, "").length < 9) errors.whatsapp = "أدخل رقم واتساب صحيحًا.";

  const timezone = text(formData, "timezone") || "Asia/Jerusalem";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    errors.timezone = "منطقة زمنية غير معروفة.";
  }

  const deliveryFee = parseAgorot(text(formData, "deliveryFee")) ?? 0;
  const minOrder = parseAgorot(text(formData, "minOrder")) ?? 0;

  const etaRaw = text(formData, "etaMinutes");
  const etaMinutes = etaRaw ? Number.parseInt(etaRaw, 10) : null;
  if (etaRaw && (!Number.isInteger(etaMinutes) || etaMinutes! < 0)) {
    errors.etaMinutes = "أدخل عددًا صحيحًا.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "راجع الحقول المميزة.", errors };
  }

  const { openingHours, orderingHours } = readHours(formData);

  await prisma.settings.update({
    where: { id: "default" },
    data: {
      name,
      tagline: optional(formData, "tagline"),
      story: optional(formData, "story"),
      address,
      city: optional(formData, "city"),
      phone: optional(formData, "phone"),
      whatsapp,
      instagram: optional(formData, "instagram"),
      facebook: optional(formData, "facebook"),
      tiktok: optional(formData, "tiktok"),
      email: optional(formData, "email"),
      mapUrl: optional(formData, "mapUrl"),
      timezone,
      deliveryAreas: optional(formData, "deliveryAreas"),
      deliveryFee,
      minOrder,
      etaMinutes: Number.isInteger(etaMinutes) ? etaMinutes : null,
      openingHours,
      orderingHours,
    },
  });

  revalidatePath("/", "layout");
  return { ok: true, message: "حُفظت الإعدادات." };
}

export async function saveAnnouncement(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await guard("/admin/settings");

  const body = text(formData, "body");
  if (body.length < 2) {
    return { ok: false, message: "اكتب نص الإعلان.", errors: { body: "النص مطلوب." } };
  }

  const active = formData.get("active") === "on";
  await prisma.announcement.create({ data: { body, active } });

  revalidatePath("/", "layout");
  return { ok: true, message: "أُضيف الإعلان." };
}

export async function toggleAnnouncement(formData: FormData): Promise<void> {
  await guard("/admin/settings");

  const id = text(formData, "id");
  if (!id) return;

  const row = await prisma.announcement.findUnique({ where: { id }, select: { active: true } });
  if (!row) return;

  await prisma.announcement.update({ where: { id }, data: { active: !row.active } });
  revalidatePath("/", "layout");
}

export async function deleteAnnouncement(formData: FormData): Promise<void> {
  await guard("/admin/settings");

  const id = text(formData, "id");
  if (!id) return;

  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/", "layout");
}
