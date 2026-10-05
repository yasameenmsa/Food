/**
 * Money. Every amount in this app is an integer number of agorot, so these are
 * the tests that keep a float from ever reaching the database.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { toAgorot, parseAgorot, formatMoney, toDecimalString } from "../lib/money";

test("toAgorot converts shekel to agorot without drift", () => {
  assert.equal(toAgorot(39.5), 3950);
  assert.equal(toAgorot(0), 0);
  assert.equal(toAgorot(1), 100);
  // The classic float trap: 0.1 + 0.2 style error must not appear.
  assert.equal(toAgorot(19.99), 1999);
  assert.equal(toAgorot(39.505), 3951); // rounds half away from zero
});

test("parseAgorot reads the forms the admin form actually produces", () => {
  assert.equal(parseAgorot("39.5"), 3950);
  assert.equal(parseAgorot("39.50"), 3950);
  assert.equal(parseAgorot("39"), 3900);
  assert.equal(parseAgorot("  39.5  "), 3950);
  assert.equal(parseAgorot("0"), 0);
});

test("parseAgorot strips the symbols a phone keyboard may include", () => {
  assert.equal(parseAgorot("39.50 ₪"), 3950);
  assert.equal(parseAgorot("₪39.50"), 3950);
  assert.equal(parseAgorot("39.50ILS"), 3950);
});

test("parseAgorot returns null for input that cannot be a price", () => {
  assert.equal(parseAgorot(""), null);
  assert.equal(parseAgorot("   "), null);
  assert.equal(parseAgorot("abc"), null);
  assert.equal(parseAgorot("."), null);
  // A negative price is never valid; callers must not silently get 0.
  assert.equal(parseAgorot("-5"), null);
  assert.equal(parseAgorot("Infinity"), null);
});

test("parseAgorot never returns a float", () => {
  for (const input of ["39.5", "39.50", "1.01", "0.07", "123.456"]) {
    const parsed = parseAgorot(input);
    assert.ok(parsed !== null);
    assert.equal(Number.isInteger(parsed), true, `${input} produced ${parsed}`);
  }
});

test("formatMoney always shows two decimals", () => {
  assert.equal(formatMoney(3950), "₪39.50");
  assert.equal(formatMoney(0), "₪0.00");
  assert.equal(formatMoney(5), "₪0.05");
  assert.equal(formatMoney(100), "₪1.00");
  assert.equal(formatMoney(3950, "ILS"), "ILS39.50");
});

test("formatMoney puts the sign before the currency", () => {
  assert.equal(formatMoney(-3950), "-₪39.50");
  assert.equal(formatMoney(-5), "-₪0.05");
});

test("formatMoney round-trips through parseAgorot", () => {
  // The admin types a price, the database stores agorot, the storefront formats
  // it back. If this drifts, the owner sees a different price than they set.
  for (const typed of ["39.5", "12.75", "7", "0.5"]) {
    const agorot = parseAgorot(typed);
    assert.ok(agorot !== null);
    assert.equal(parseAgorot(toDecimalString(agorot)), agorot, `failed for ${typed}`);
  }
});

test("toDecimalString gives the admin an editable value", () => {
  assert.equal(toDecimalString(3950), "39.50");
  assert.equal(toDecimalString(0), "0.00");
  assert.equal(toDecimalString(5), "0.05");
});
