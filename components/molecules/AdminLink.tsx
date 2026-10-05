"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/atoms/Icon";

/**
 * The Admin link, shown only to the owner.
 *
 * This is the only thing in the storefront that knows about the session cookie.
 * It used to be a server-side `hasSession()` call in the shell, which opted every
 * storefront route into dynamic rendering and left nothing static or CDN-cacheable
 * — for the sake of one link. `/api/session` answers the same question with one
 * small JSON request.
 *
 * It renders nothing until the answer arrives and reserves no space while
 * waiting, so it cannot shift the navbar when it appears.
 *
 * `moduleLevel` de-duplicates the request: the navbar renders this twice (desktop
 * icon and drawer row), and both share one in-flight promise.
 */

type SessionAnswer = { isAdmin: boolean };

let inFlight: Promise<SessionAnswer> | null = null;

/** One request per page load, shared by every AdminLink on the page. */
function askServer(): Promise<SessionAnswer> {
  inFlight ??= fetch("/api/session")
    .then((response) => (response.ok ? (response.json() as Promise<SessionAnswer>) : { isAdmin: false }))
    .catch(() => ({ isAdmin: false }))
    .finally(() => {
      // Allow a later mount (client navigation) to ask again.
      setTimeout(() => {
        inFlight = null;
      }, 0);
    });
  return inFlight;
}

function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    askServer().then((answer) => {
      if (active) setIsAdmin(answer.isAdmin);
    });
    return () => {
      active = false;
    };
  }, []);

  return isAdmin;
}

export type AdminLinkProps = {
  variant: "icon" | "drawer";
};

function Body({ variant }: AdminLinkProps): ReactNode {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;

  if (variant === "drawer") {
    return (
      <li>
        <Link
          href="/admin"
          className="flex items-center gap-3 rounded-card px-3 py-3 text-lg font-bold text-brand hover:bg-stone/40"
        >
          <Icon name="dashboard" size={20} />
          لوحة التحكم
        </Link>
      </li>
    );
  }

  return (
    <Link
      href="/admin"
      aria-label="لوحة التحكم"
      className="hidden size-11 items-center justify-center rounded-card border-2 border-line text-brand transition-colors hover:border-brand sm:flex"
    >
      <Icon name="dashboard" size={20} />
    </Link>
  );
}

export function AdminLink({ variant }: AdminLinkProps) {
  return <Body variant={variant} />;
}
