"use client";

import { useState } from "react";
import { Icon } from "@/components/atoms/Icon";

/** Copies text and confirms inline, so the user is never left guessing. */
export function CopyButton({ value, label = "نسخ" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className="inline-flex h-11 items-center gap-2 rounded-card border-2 border-line bg-surface px-4 text-sm font-bold text-brand transition-colors hover:border-brand"
    >
      <Icon name={copied ? "check" : "copy"} size={16} />
      {copied ? "تم النسخ" : label}
    </button>
  );
}