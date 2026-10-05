"use client";

import { Icon } from "@/components/atoms/Icon";

export type QuantityStepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label: string;
  /** Hide the visible label; the buttons keep their own accessible names. */
  hideLabel?: boolean;
  size?: "md" | "sm";
};

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
  hideLabel = false,
  size = "md",
}: QuantityStepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  const dimension = size === "sm" ? "size-9" : "size-11";
  const text = size === "sm" ? "text-base" : "text-lg";

  return (
    <div className="inline-flex items-center gap-3">
      {hideLabel ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className="font-semibold">{label}</span>
      )}

      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          aria-label={`إنقاص ${label}`}
          className={`flex ${dimension} items-center justify-center rounded-full border-2 border-line bg-surface text-brand transition-colors hover:border-brand disabled:pointer-events-none disabled:opacity-40`}
        >
          <Icon name="minus" size={size === "sm" ? 16 : 18} />
        </button>

        <span
          className={`nums ${size === "sm" ? "w-6" : "w-8"} text-center font-bold`}
          aria-live="polite"
        >
          {value}
        </span>

        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          aria-label={`زيادة ${label}`}
          className={`flex ${dimension} items-center justify-center rounded-full border-2 border-line bg-surface text-brand transition-colors hover:border-brand disabled:pointer-events-none disabled:opacity-40`}
        >
          <Icon name="plus" size={size === "sm" ? 16 : 18} />
        </button>
      </div>
    </div>
  );
}
