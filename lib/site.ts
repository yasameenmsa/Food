/**
 * The public origin of the site.
 *
 * This was previously inlined as
 * `process.env.NEXT_PUBLIC_SITE_URL ?? "https://alzaytona.example"` at three
 * call sites, which meant the placeholder domain leaked into every WhatsApp link
 * and every Open Graph tag the moment the variable was unset. One place now, and
 * a hard failure in production rather than a silent placeholder.
 */

const PLACEHOLDER = "https://alzaytona.example";

/** The site origin with no trailing slash, e.g. `https://alzaytona.ps`. */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) return configured.replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be set in production. Refusing to emit the placeholder domain in WhatsApp links and Open Graph tags.",
    );
  }

  return PLACEHOLDER;
}

/** Absolute URL for a site-relative path, for canonical links and JSON-LD. */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
