import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { DEFAULT_HOURS, parseHours, type DayWindow, type HoursMap } from "@/lib/hours";

export type Settings = {
  name: string;
  tagline: string | null;
  story: string | null;
  address: string;
  city: string | null;
  phone: string | null;
  whatsapp: string;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  email: string | null;
  mapUrl: string | null;
  currency: string;
  timezone: string;
  deliveryFee: number;
  minOrder: number;
  deliveryAreas: string | null;
  etaMinutes: number | null;
  logoImageId: string | null;
  openingHours: HoursMap;
  orderingHours: HoursMap;
};

/**
 * Deduplicated per request. Always returns a usable object so pages never have
 * to null-check, even before the owner has filled anything in.
 */
export const getSettings = cache(async (): Promise<Settings> => {
  const row = await prisma.settings.findUnique({
    where: { id: "default" },
    include: { logoImage: true },
  });

  if (!row) {
    return {
      name: "مطعم الزيتونة",
      tagline: null,
      story: null,
      address: "",
      city: null,
      phone: null,
      whatsapp: "",
      instagram: null,
      facebook: null,
      tiktok: null,
      email: null,
      mapUrl: null,
      currency: "₪",
      timezone: "Asia/Jerusalem",
      deliveryFee: 0,
      minOrder: 0,
      deliveryAreas: null,
      etaMinutes: null,
      logoImageId: null,
      openingHours: DEFAULT_HOURS,
      orderingHours: DEFAULT_HOURS,
    };
  }

  const opening = parseHours(row.openingHours);
  const ordering = parseHours(row.orderingHours);

  return {
    name: row.name,
    tagline: row.tagline,
    story: row.story,
    address: row.address,
    city: row.city,
    phone: row.phone,
    whatsapp: row.whatsapp,
    instagram: row.instagram,
    facebook: row.facebook,
    tiktok: row.tiktok,
    email: row.email,
    mapUrl: row.mapUrl,
    currency: row.currency,
    timezone: row.timezone,
    deliveryFee: row.deliveryFee,
    minOrder: row.minOrder,
    deliveryAreas: row.deliveryAreas,
    etaMinutes: row.etaMinutes,
    logoImageId: row.logoImageId,
    openingHours: Object.keys(opening).length ? opening : DEFAULT_HOURS,
    orderingHours: Object.keys(ordering).length ? ordering : DEFAULT_HOURS,
  };
});

/** Normalises a phone number into the digits wa.me expects (no +, no spaces). */
export function whatsappDigits(whatsapp: string): string {
  return whatsapp.replace(/[^\d]/g, "");
}

export function whatsappLink(whatsapp: string, message: string): string {
  return `https://wa.me/${whatsappDigits(whatsapp)}?text=${encodeURIComponent(message)}`;
}

export type { DayWindow, HoursMap };