import { test } from "node:test";
import assert from "node:assert/strict";
import { RESTAURANT_TIME_ZONE, formatDateTime } from "../lib/datetime";

const TZ = RESTAURANT_TIME_ZONE;

test("formatDateTime renders a date and a time without throwing", () => {
  // Regression: the admin orders page used `toLocaleDateString` with a
  // `timeStyle` option, which throws `TypeError: Invalid option : timeStyle`
  // and 500'd /admin on every render.
  const out = formatDateTime("2026-01-03T10:00:00Z");
  assert.equal(typeof out, "string");
  assert.ok(out.length > 0, "should produce a non-empty string");
});

test("formatDateTime accepts both Date and ISO strings", () => {
  const iso = "2026-01-03T10:00:00Z";
  assert.equal(formatDateTime(iso), formatDateTime(new Date(iso)));
});

test("formatDateTime applies the restaurant timezone, not the server one", () => {
  // 2026-01-03T22:30:00Z is 2026-01-04 00:30 in Jerusalem (UTC+2 in January),
  // so the local date must roll forward a day.
  const instant = "2026-01-03T22:30:00Z";
  assert.notEqual(
    formatDateTime(instant, TZ),
    formatDateTime(instant, "UTC"),
    "timezone option must change the rendered value",
  );
});

test("formatDateTime includes a time component, not just a date", () => {
  // Arabic medium date + short time always contains an AM/PM marker.
  assert.match(formatDateTime("2026-01-03T10:00:00Z"), /[٠-٩]/);
  assert.match(formatDateTime("2026-01-03T14:00:00Z"), /[صم]/);
});