/**
 * JSON-LD for the storefront.
 *
 * Emitted as `<script type="application/ld+json">` rather than through Next's
 * metadata API, because opening hours have to come from the owner's `Settings`
 * row at request time and Next's typed metadata has no slot for structured data.
 *
 * Opening hours are expressed in schema.org `OpeningHoursSpecification` form. A
 * day the shop is closed is omitted rather than emitted with a zero-length
 * window, which search engines read as "open 24 hours" — the opposite of truth.
 */
import { DAY_NAMES_AR, type HoursMap } from "@/lib/hours";
import type { Settings } from "@/lib/settings";
import type { DishDTO } from "@/types";
import { absoluteUrl } from "@/lib/site";

/** schema.org day URIs, Monday-first, matching JS day index (0 = Sunday). */
const SCHEMA_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function openingHours(hours: HoursMap) {
  const specs: Array<Record<string, string>> = [];

  for (let day = 0; day < 7; day += 1) {
    const window = hours[String(day)];
    if (!window) continue; // closed that day

    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${SCHEMA_DAYS[day]}`,
      opens: window.open,
      closes: window.close,
    });
  }

  return specs;
}

/** `Restaurant` for the home page: who, where, when, how to order. */
export function restaurantJsonLd(settings: Settings) {
  const sameAs = [settings.instagram, settings.facebook, settings.tiktok]
    .filter((handle): handle is string => Boolean(handle && handle.length > 0))
    .map((handle) => (handle.startsWith("http") ? handle : `https://${handle.replace(/^@/, "")}`));

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: settings.name,
    ...(settings.tagline ? { description: settings.tagline } : {}),
    url: absoluteUrl("/"),
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(settings.address || settings.city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(settings.address ? { streetAddress: settings.address } : {}),
            ...(settings.city ? { addressLocality: settings.city } : {}),
            addressCountry: "PS",
          },
        }
      : {}),
    ...(settings.mapUrl ? { hasMap: settings.mapUrl } : {}),
    currenciesAccepted: settings.currency,
    ...(settings.deliveryFee > 0 ? { deliveryFee: settings.deliveryFee / 100 } : {}),
    ...(openingHours(settings.openingHours).length
      ? { openingHoursSpecification: openingHours(settings.openingHours) }
      : {}),
    servesCuisine: "Levantine",
  };
}

/** `Product` for a dish page, with the live price as the offer. */
export function productJsonLd(dish: DishDTO, settings: Settings) {
  const url = absoluteUrl(`/menu/${dish.slug}`);
  const description = dish.description ?? `${dish.name} من ${settings.name}.`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: dish.name,
    description,
    url,
    ...(dish.image ? { image: [absoluteUrl(dish.image.src)] } : {}),
    category: dish.categoryName,
    ...(dish.available
      ? {
          offers: {
            "@type": "Offer",
            price: (dish.currentPrice / 100).toFixed(2),
            priceCurrency: "ILS",
            availability: "https://schema.org/InStock",
            url,
            ...(dish.special?.expiresAt
              ? { validThrough: dish.special.expiresAt.slice(0, 10) }
              : {}),
          },
        }
      : {}),
  };
}

/** Arabic-language day names, for the visible hours table. */
export { DAY_NAMES_AR };
