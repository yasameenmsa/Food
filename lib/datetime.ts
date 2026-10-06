/**
 * Date and time formatting for the admin UI.
 *
 * Kept out of components so it can be tested: `toLocaleDateString` throws
 * `TypeError: Invalid option : timeStyle`, and a page that formats a timestamp
 * wrongly 500s on every render. Anything showing a date *and* a time must go
 * through `toLocaleString`.
 */

export const RESTAURANT_TIME_ZONE = "Asia/Jerusalem";

/** Medium Arabic date plus short time in the restaurant's timezone. */
export function formatDateTime(
  value: Date | string,
  timeZone: string = RESTAURANT_TIME_ZONE,
): string {
  return new Date(value).toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  });
}