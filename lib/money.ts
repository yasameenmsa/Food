/**
 * All money in this app is stored and passed around as an integer number of
 * agorot (1 shekel = 100 agorot) so totals never drift.
 */

export function toAgorot(shekel: number): number {
  return Math.round(shekel * 100);
}

/** Parses admin input like "39.5" or "39.50" into agorot. Returns null if unusable. */
export function parseAgorot(input: string): number | null {
  // Reject a negative sign before stripping. The strip below removes every
  // character that is not a digit or a dot, which includes "-", so "-5" would
  // otherwise be read as 5 and a mistyped negative price would silently become
  // a positive one.
  if (input.includes("-")) return null;

  const trimmed = input.trim().replace(/[^\d.]/g, "");
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export function formatMoney(agorot: number, currency = "₪"): string {
  const sign = agorot < 0 ? "-" : "";
  const abs = Math.abs(agorot);
  const whole = Math.floor(abs / 100);
  const cents = abs % 100;
  return `${sign}${currency}${whole}.${String(cents).padStart(2, "0")}`;
}

/** Just the digits, e.g. 3950 -> "39.50", for prefilling an input field. */
export function toDecimalString(agorot: number): string {
  return (agorot / 100).toFixed(2);
}