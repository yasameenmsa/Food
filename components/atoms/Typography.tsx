import type { ElementType, ReactNode } from "react";

export type HeadingLevel = "h1" | "h2" | "h3" | "h4";

/* brand-style.md type scale: H1 56/36 Lalezar, H2 40/28 Lalezar, H3 24/20 Cairo 700. */
const LEVELS: Record<HeadingLevel, string> = {
  h1: "font-display text-4xl leading-[1.2] md:text-5xl lg:text-6xl",
  h2: "font-display text-3xl leading-[1.25] md:text-4xl",
  h3: "text-xl font-bold leading-[1.4] md:text-2xl",
  h4: "text-lg font-bold leading-snug",
};

export function Heading({
  level = "h2",
  className = "",
  children,
}: {
  level?: HeadingLevel;
  className?: string;
  children: ReactNode;
}) {
  const Tag = level as ElementType;
  return <Tag className={`${LEVELS[level]} ${className}`}>{children}</Tag>;
}

export type TextTone = "default" | "muted" | "brand" | "gold" | "danger" | "cream";
export type TextSize = "sm" | "base" | "lg";

const TONES: Record<TextTone, string> = {
  default: "text-foreground",
  muted: "text-muted",
  brand: "text-brand",
  gold: "text-gold",
  danger: "text-danger",
  cream: "text-brand-foreground",
};

const TEXT_SIZES: Record<TextSize, string> = {
  sm: "text-sm leading-relaxed",
  base: "text-base",
  lg: "text-lg leading-relaxed",
};

export function Text({
  tone = "default",
  size = "base",
  className = "",
  children,
}: {
  tone?: TextTone;
  size?: TextSize;
  className?: string;
  children: ReactNode;
}) {
  return <p className={`${TONES[tone]} ${TEXT_SIZES[size]} ${className}`}>{children}</p>;
}

/**
 * Prices and phone numbers. `nums` isolates the LTR run so a price never
 * reorders inside an Arabic sentence.
 */
export function Numeral({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`nums ${className}`}>{children}</span>;
}