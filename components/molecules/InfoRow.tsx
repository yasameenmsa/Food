import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/atoms/Icon";

export type SocialLink = {
  name: IconName;
  label: string;
  href: string;
};

/** Solid olive rounded squares with a cream glyph — per brand-style.md §5. */
export function SocialLinks({ links }: { links: SocialLink[] }) {
  if (links.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-2">
      {links.map((link) => (
        <li key={link.label}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className="flex size-11 items-center justify-center rounded-[8px] bg-brand text-brand-foreground transition-colors hover:bg-accent"
          >
            <Icon name={link.name} size={22} />
          </a>
        </li>
      ))}
    </ul>
  );
}

/**
 * Label + value + icon, used for phone / address / hours blocks. Keeps the LTR
 * run (`ltr-run`) around anything Latin so it does not reorder inside Arabic.
 */
export function InfoRow({
  icon,
  label,
  children,
}: {
  icon: IconName;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-brand text-brand-foreground">
        <Icon name={icon} size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-muted">{label}</p>
        <div className="font-semibold">{children}</div>
      </div>
    </div>
  );
}