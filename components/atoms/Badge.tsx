import Link from "next/link";
import type { ReactNode } from "react";

export type BadgeTone = "default" | "success" | "warning" | "danger" | "info" | "accent";

const TONES: Record<BadgeTone, string> = {
  default: "bg-stone/50 text-brand border-stone",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-danger/10 text-danger border-danger/30",
  info: "bg-brand/10 text-brand border-brand/25",
  accent: "bg-accent/15 text-brown border-accent/40",
};

/**
 * Tone is never the only signal — every badge carries text, so status survives
 * for anyone who cannot separate the colours.
 */
export function Badge({
  tone = "default",
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export type ChipProps = {
  href: string;
  children: ReactNode;
  active?: boolean;
  className?: string;
};

/** A filter pill that is a real link, so filters are shareable and crawlable. */
export function Chip({ href, children, active = false, className = "" }: ChipProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "inline-flex min-h-9 items-center rounded-full border-2 px-4 py-1 text-sm font-bold",
        "transition-colors duration-200",
        active
          ? "border-brand bg-brand text-brand-foreground"
          : "border-line bg-surface text-brand hover:border-brand",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Link>
  );
}