import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/atoms/Icon";
import { getSettings } from "@/lib/settings";

/** Centred card used by login and any other single-purpose screen. */
export async function AuthTemplate({
  title,
  subtitle,
  children,
  backHref,
  backLabel,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  const settings = await getSettings();

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-cream to-surface">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <Link
          href={backHref ?? "/"}
          className="mb-6 inline-flex items-center gap-2 self-start font-bold text-brand"
        >
          <Icon name="leaf" size={26} />
          {settings.name}
        </Link>

        <div className="rounded-lg border border-line bg-surface p-6 shadow-brand md:p-8">
          <h1 className="font-display text-3xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-muted">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
