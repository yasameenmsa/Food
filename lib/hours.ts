/**
 * Opening/ordering hours.
 *
 * Stored shape, keyed by JS day index (0 = Sunday .. 6 = Saturday):
 *   { "0": { "open": "10:00", "close": "23:00" }, "1": null }
 * A null/absent day is closed. A window where close <= open wraps past midnight.
 *
 * All "is it open right now" maths is done in the restaurant's own timezone via
 * Intl, so it stays correct no matter where the server runs.
 */

export type DayWindow = { open: string; close: string };
export type HoursMap = Record<string, DayWindow | null>;

export const DAY_NAMES_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

export const DEFAULT_HOURS: HoursMap = {
  "0": { open: "10:00", close: "23:00" },
  "1": { open: "10:00", close: "23:00" },
  "2": { open: "10:00", close: "23:00" },
  "3": { open: "10:00", close: "23:00" },
  "4": { open: "10:00", close: "23:00" },
  "5": { open: "10:00", close: "23:00" },
  "6": { open: "10:00", close: "23:00" },
};

export function parseHours(value: unknown): HoursMap {
  if (!value || typeof value !== "object") return {};
  const out: HoursMap = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const day = Number(key);
    if (!Number.isInteger(day) || day < 0 || day > 6) continue;
    if (entry === null || entry === undefined) {
      out[String(day)] = null;
      continue;
    }
    const window = entry as Partial<DayWindow>;
    if (isValidTime(window.open) && isValidTime(window.close)) {
      out[String(day)] = { open: window.open!, close: window.close! };
    } else {
      out[String(day)] = null;
    }
  }
  return out;
}

export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function wrapsMidnight(window: DayWindow): boolean {
  return toMinutes(window.close) <= toMinutes(window.open);
}

/** Wall-clock day index and minutes-since-midnight in `timeZone`. */
function zonedNow(now: Date, timeZone: string): { day: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  // Intl can emit hour "24" for midnight in some ICU versions.
  const hour = get("hour") % 24;
  const year = get("year");
  const month = get("month");
  const day = get("day");

  const dayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { day: dayIndex, minute: hour * 60 + get("minute") };
}

export type OpenState = {
  isOpen: boolean;
  /** Next open or close moment, as a wall-clock position. */
  nextChange: { dayIndex: number; minute: number; kind: "open" | "close" } | null;
};

export function getOpenState(hours: HoursMap, now: Date, timeZone: string): OpenState {
  const { day, minute } = zonedNow(now, timeZone);
  const today = hours[String(day)] ?? null;
  const yesterday = hours[String((day + 6) % 7)] ?? null;

  let isOpen = false;
  if (today && wrapsMidnight(today) && minute >= toMinutes(today.open)) isOpen = true;
  if (today && !wrapsMidnight(today) && minute >= toMinutes(today.open) && minute < toMinutes(today.close)) {
    isOpen = true;
  }
  // A window that started yesterday and runs past midnight.
  if (yesterday && wrapsMidnight(yesterday) && minute < toMinutes(yesterday.close)) isOpen = true;

  return { isOpen, nextChange: findNextChange(hours, day, minute, isOpen) };
}

function findNextChange(
  hours: HoursMap,
  todayIndex: number,
  minute: number,
  isOpen: boolean,
): OpenState["nextChange"] {
  // Work in absolute minutes from today's midnight so a window that wraps past
  // midnight lands on the following day, then convert back to a wall clock.
  const nowAbs = minute;
  const wantKind = isOpen ? "close" : "open";
  let best: { abs: number; dayIndex: number; minute: number } | null = null;

  for (let offset = 0; offset <= 7; offset++) {
    const dayIndex = (todayIndex + offset) % 7;
    const window = hours[String(dayIndex)] ?? null;
    if (!window) continue;

    const candidates: { abs: number; kind: "open" | "close" }[] = [
      { abs: offset * 1440 + toMinutes(window.open), kind: "open" },
      wrapsMidnight(window)
        ? { abs: (offset + 1) * 1440 + toMinutes(window.close), kind: "close" }
        : { abs: offset * 1440 + toMinutes(window.close), kind: "close" },
    ];

    for (const candidate of candidates) {
      if (candidate.kind !== wantKind) continue;
      if (candidate.abs <= nowAbs) continue;
      if (!best || candidate.abs < best.abs) {
        best = {
          abs: candidate.abs,
          dayIndex: (todayIndex + Math.floor(candidate.abs / 1440)) % 7,
          minute: candidate.abs % 1440,
        };
      }
    }
  }

  if (!best) return null;
  return { dayIndex: best.dayIndex, minute: best.minute, kind: wantKind };
}

function formatMinute(minute: number): string {
  const h = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Human Arabic sentence describing the next change, e.g. "يفتح الساعة 10:00". */
export function describeNextChange(
  hours: HoursMap,
  now: Date,
  timeZone: string,
  noun: "restaurant" | "kitchen" = "kitchen",
): string {
  const { isOpen, nextChange } = getOpenState(hours, now, timeZone);
  const subject = noun === "kitchen" ? "المطبخ" : "المطعم";

  if (isOpen && nextChange?.kind === "close") {
    return `مفتوح الآن — يُغلق ${subject} الساعة ${formatMinute(nextChange.minute)}`;
  }
  if (isOpen) return `مفتوح الآن`;
  if (!nextChange) return `${subject} مغلق`;

  const today = zonedNow(now, timeZone).day;
  const dayDiff = (nextChange.dayIndex - today + 7) % 7;
  const when =
    dayDiff === 0
      ? `اليوم الساعة ${formatMinute(nextChange.minute)}`
      : dayDiff === 1
        ? `غدًا الساعة ${formatMinute(nextChange.minute)}`
        : `${DAY_NAMES_AR[nextChange.dayIndex]} الساعة ${formatMinute(nextChange.minute)}`;

  return `${subject} مغلق — يفتح ${when}`;
}

/** "10:00 - 23:00" or "مغلق" for a single day. */
export function formatDayWindow(window: DayWindow | null | undefined): string {
  if (!window) return "مغلق";
  return `${formatMinute(toMinutes(window.open))} - ${formatMinute(toMinutes(window.close))}`;
}