import { Container } from "@/components/atoms/Layout";
import { Heading } from "@/components/atoms/Typography";
import { Icon } from "@/components/atoms/Icon";
import { DAY_NAMES_AR, formatDayWindow } from "@/lib/hours";
import type { Settings } from "@/lib/settings";

export type OpeningHoursPanelProps = {
  settings: Settings;
  isOpen: boolean;
  openNote: string | null;
};

/**
 * Full week for both the shop and the kitchen. When they differ the kitchen row
 * is the one that matters for ordering, so it is labelled and pulled first.
 */
export function OpeningHoursPanel({ settings, isOpen, openNote }: OpeningHoursPanelProps) {
  const todayIndex = new Date().getDay();
  const sameHours =
    JSON.stringify(settings.openingHours) === JSON.stringify(settings.orderingHours);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-line bg-surface p-6 shadow-brand">
        <div className="flex items-center justify-between gap-3">
          <Heading level="h3">أوقات الدوام</Heading>
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
              isOpen ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
            ].join(" ")}
          >
            <Icon name={isOpen ? "check" : "clock"} size={14} />
            {isOpen ? "مفتوح الآن" : "مغلق"}
          </span>
        </div>
        {openNote ? <p className="mt-2 text-sm font-semibold">{openNote}</p> : null}

        <dl className="mt-4 flex flex-col gap-1 text-sm">
          {DAY_NAMES_AR.map((day, index) => (
            <div
              key={day}
              className={[
                "flex justify-between gap-3 py-1",
                index === todayIndex ? "font-bold" : "",
              ].join(" ")}
            >
              <dt>{day}</dt>
              <dd className="nums">{formatDayWindow(settings.openingHours[String(index)])}</dd>
            </div>
          ))}
        </dl>
      </div>

      {!sameHours ? (
        <div className="rounded-lg border border-line bg-surface p-6 shadow-brand">
          <Heading level="h3">أوقات استقبال الطلبات</Heading>
          <p className="mt-2 text-sm text-muted">
            الطلبات تُقبل في هذه الأوقات تحديدًا، حتى لو كان المحل مفتوحًا.
          </p>
          <dl className="mt-4 flex flex-col gap-1 text-sm">
            {DAY_NAMES_AR.map((day, index) => (
              <div
                key={day}
                className={[
                  "flex justify-between gap-3 py-1",
                  index === todayIndex ? "font-bold" : "",
                ].join(" ")}
              >
                <dt>{day}</dt>
                <dd className="nums">{formatDayWindow(settings.orderingHours[String(index)])}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}