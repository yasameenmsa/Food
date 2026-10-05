import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_HOURS,
  describeNextChange,
  formatDayWindow,
  getOpenState,
  isValidTime,
  parseHours,
} from "../lib/hours";

const TZ = "Asia/Jerusalem";

function offsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return asUtc - instant.getTime();
}

/** Builds the UTC instant for a wall-clock time in `timeZone`, DST included. */
function zonedToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let result = guess - offsetMs(new Date(guess), timeZone);
  result = guess - offsetMs(new Date(result), timeZone);
  return new Date(result);
}

/** 2026-01-04 is a Sunday, so dayOffset 0 is that Sunday. */
function localTime(dayOffsetFromSunday: number, hour: number, minute = 0): Date {
  const base = new Date(Date.UTC(2026, 0, 4));
  base.setUTCDate(base.getUTCDate() + dayOffsetFromSunday);
  return zonedToUtc(
    base.getUTCFullYear(),
    base.getUTCMonth() + 1,
    base.getUTCDate(),
    hour,
    minute,
    TZ,
  );
}

const ALL_DAY_10_TO_23 = parseHours({
  "0": { open: "10:00", close: "23:00" },
  "1": { open: "10:00", close: "23:00" },
  "2": { open: "10:00", close: "23:00" },
  "3": { open: "10:00", close: "23:00" },
  "4": { open: "10:00", close: "23:00" },
  "5": { open: "10:00", close: "23:00" },
  "6": { open: "10:00", close: "23:00" },
});

test("isValidTime accepts real clock times and rejects junk", () => {
  assert.equal(isValidTime("00:00"), true);
  assert.equal(isValidTime("23:59"), true);
  assert.equal(isValidTime("24:00"), false);
  assert.equal(isValidTime("9:00"), false);
  assert.equal(isValidTime("10:0"), false);
  assert.equal(isValidTime(null), false);
  assert.equal(isValidTime(1000), false);
});

test("parseHours drops malformed days and windows", () => {
  const parsed = parseHours({ "0": { open: "10:00", close: "23:00" }, "9": { open: "1", close: "2" }, "1": "nope" });
  assert.deepEqual(parsed, { "0": { open: "10:00", close: "23:00" }, "1": null });
});

test("parseHours survives non-object input", () => {
  assert.deepEqual(parseHours(null), {});
  assert.deepEqual(parseHours("nope"), {});
});

test("closed before opening, opens later the same day", () => {
  const state = getOpenState(ALL_DAY_10_TO_23, localTime(0, 9), TZ);
  assert.equal(state.isOpen, false);
  assert.equal(state.nextChange?.kind, "open");
  assert.equal(state.nextChange?.dayIndex, 0, "should be today, not tomorrow");
  assert.equal(state.nextChange?.minute, 10 * 60);
});

test("open mid-service, closes later the same day", () => {
  const state = getOpenState(ALL_DAY_10_TO_23, localTime(0, 12), TZ);
  assert.equal(state.isOpen, true);
  assert.equal(state.nextChange?.kind, "close");
  assert.equal(state.nextChange?.dayIndex, 0);
  assert.equal(state.nextChange?.minute, 23 * 60);
});

test("opening time exactly at now counts as open", () => {
  assert.equal(getOpenState(ALL_DAY_10_TO_23, localTime(0, 10, 0), TZ).isOpen, true);
});

test("closing time exactly at now counts as closed", () => {
  assert.equal(getOpenState(ALL_DAY_10_TO_23, localTime(0, 23, 0), TZ).isOpen, false);
});

test("late evening before close is still open", () => {
  assert.equal(getOpenState(ALL_DAY_10_TO_23, localTime(0, 22, 59), TZ).isOpen, true);
});

test("closed today reopens tomorrow", () => {
  const state = getOpenState(ALL_DAY_10_TO_23, localTime(0, 23, 30), TZ);
  assert.equal(state.isOpen, false);
  assert.equal(state.nextChange?.kind, "open");
  assert.equal(state.nextChange?.dayIndex, 1, "Sunday 23:30 should reopen Monday");
});

test("a window wrapping midnight stays open into the next morning", () => {
  const sundayNight = parseHours({ "0": { open: "22:00", close: "02:00" } });
  // Sunday 23:30
  assert.equal(getOpenState(sundayNight, localTime(0, 23, 30), TZ).isOpen, true);
  // Monday 01:30, still inside Sunday's window
  assert.equal(getOpenState(sundayNight, localTime(1, 1, 30), TZ).isOpen, true);
  // Monday 03:00, past the close
  assert.equal(getOpenState(sundayNight, localTime(1, 3, 0), TZ).isOpen, false);
  // Sunday 21:00, before the wrap window opens
  assert.equal(getOpenState(sundayNight, localTime(0, 21, 0), TZ).isOpen, false);
});

test("wrapping window reports its close on the following day", () => {
  const sundayNight = parseHours({ "0": { open: "22:00", close: "02:00" } });
  const state = getOpenState(sundayNight, localTime(0, 23, 30), TZ);
  assert.equal(state.nextChange?.kind, "close");
  assert.equal(state.nextChange?.dayIndex, 1);
  assert.equal(state.nextChange?.minute, 2 * 60);
});

test("a fully closed week reports no next change", () => {
  const never = parseHours({ "0": null, "1": null, "2": null, "3": null, "4": null, "5": null, "6": null });
  const state = getOpenState(never, localTime(2, 12), TZ);
  assert.equal(state.isOpen, false);
  assert.equal(state.nextChange, null);
});

test("a single open day is found from any other day", () => {
  const fridayOnly = parseHours({ "5": { open: "11:00", close: "15:00" } });
  // Sunday noon -> should point at Friday
  const state = getOpenState(fridayOnly, localTime(0, 12), TZ);
  assert.equal(state.isOpen, false);
  assert.equal(state.nextChange?.kind, "open");
  assert.equal(state.nextChange?.dayIndex, 5);
  assert.equal(state.nextChange?.minute, 11 * 60);
});

test("state is computed in the restaurant timezone, not the server one", () => {
  // 20:00 UTC is 22:00 Jerusalem (UTC+2 in January). Server is assumed UTC.
  const instant = new Date("2026-01-04T20:00:00Z");
  assert.equal(getOpenState(ALL_DAY_10_TO_23, instant, TZ).isOpen, true);
  // Same instant read as UTC would be 20:00, still open, so use a boundary case:
  // 21:00 UTC == 23:00 Jerusalem == closing time.
  const boundary = new Date("2026-01-04T21:00:00Z");
  assert.equal(getOpenState(ALL_DAY_10_TO_23, boundary, TZ).isOpen, false);
  // Read in UTC the same instant is 21:00 which would still be "open" — proves
  // the timezone is actually being applied.
  assert.equal(getOpenState(ALL_DAY_10_TO_23, boundary, "UTC").isOpen, true);
});

test("describeNextChange reads naturally in Arabic", () => {
  assert.match(describeNextChange(ALL_DAY_10_TO_23, localTime(0, 9), TZ), /اليوم الساعة 10:00/);
  assert.match(describeNextChange(ALL_DAY_10_TO_23, localTime(0, 12), TZ), /مفتوح الآن/);
  assert.match(describeNextChange(ALL_DAY_10_TO_23, localTime(0, 23, 30), TZ), /غدًا/);
  const never = parseHours({ "0": null });
  assert.match(describeNextChange(never, localTime(0, 12), TZ), /مغلق$/);
});

test("formatDayWindow renders a window or مغلق", () => {
  assert.equal(formatDayWindow({ open: "10:00", close: "23:00" }), "10:00 - 23:00");
  assert.equal(formatDayWindow(null), "مغلق");
  assert.equal(formatDayWindow(undefined), "مغلق");
});

test("DEFAULT_HOURS is a full seven-day week", () => {
  const parsed = parseHours(DEFAULT_HOURS);
  assert.equal(Object.keys(parsed).length, 7);
  assert.equal(Object.values(parsed).every((w) => w !== null), true);
});