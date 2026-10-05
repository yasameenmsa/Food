import Link from "next/link";
import type { IconName } from "@/components/atoms/Icon";
import { Icon } from "@/components/atoms/Icon";

export type NavItemProps = {
  href: string;
  label: string;
  icon?: IconName;
  active?: boolean;
};

/** Top-level navigation entry. Active state is marked with `aria-current`. */
export function NavItem({ href, label, icon, active = false }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "inline-flex items-center gap-2 rounded-card px-3 py-2 font-bold transition-colors",
        active ? "bg-brand text-brand-foreground" : "text-brand hover:bg-stone/40",
      ].join(" ")}
    >
      {icon ? <Icon name={icon} size={18} /> : null}
      {label}
    </Link>
  );
}

/** A category entry in the menu sidebar, indented under its heading. */
export function CategoryLink({
  href,
  label,
  count,
  active = false,
}: {
  href: string;
  label: string;
  count?: number;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "flex items-center justify-between gap-2 rounded-card px-3 py-2.5 font-semibold transition-colors",
        active
          ? "bg-brand text-brand-foreground"
          : "text-brand hover:bg-stone/40 hover:text-brand",
      ].join(" ")}
    >
      <span>{label}</span>
      {typeof count === "number" ? (
        <span
          className={[
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold nums",
            active ? "bg-brand-foreground/20" : "bg-stone/50 text-muted",
          ].join(" ")}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}