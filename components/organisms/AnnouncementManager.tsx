"use client";

import { useActionState } from "react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Input } from "@/components/atoms/Field";
import { FormAlert } from "@/components/molecules/FormField";
import { Checkbox } from "@/components/atoms/Field";
import { saveAnnouncement, toggleAnnouncement, deleteAnnouncement } from "@/app/admin/actions";
import type { AnnouncementDTO, FormState } from "@/types";

export function AnnouncementManager({
  announcements,
}: {
  announcements: AnnouncementDTO[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveAnnouncement, {
    ok: false,
  });

  return (
    <section className="rounded-lg border border-line bg-surface p-5 shadow-brand">
      <h2 className="font-display text-xl">شريط الإعلانات</h2>
      <p className="mt-1 text-sm text-muted">
        يظهر أعلى الموقع في كل الصفحات.
      </p>

      {state.message ? (
        <div className="mt-3">
          <FormAlert tone={state.ok ? "success" : "danger"}>{state.message}</FormAlert>
        </div>
      ) : null}

      <form action={formAction} className="mt-4 space-y-3">
        <Input
          label="النص"
          name="body"
          required
          placeholder="مغلق يوم الجمعة due to العطلة"
          error={state.errors?.body}
        />
        <div className="flex flex-wrap items-center gap-4">
          <Checkbox name="active" label="مفعّل" defaultChecked />
          <Button type="submit" size="sm" loading={pending}>
            <Icon name="plus" size={16} />
            إضافة
          </Button>
        </div>
      </form>

      {announcements.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-2">
          {announcements.map((announcement) => (
            <AnnouncementRow key={announcement.id} announcement={announcement} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function AnnouncementRow({ announcement }: { announcement: AnnouncementDTO }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-card border border-line p-3">
      <span className="text-sm">{announcement.body}</span>
      <span className="flex shrink-0 gap-1">
        <form action={toggleAnnouncement}>
          <input type="hidden" name="id" value={announcement.id} />
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-card px-3 text-xs font-bold text-brand hover:bg-stone/40"
          >
            {announcement.active ? "إخفاء" : "إظهار"}
          </button>
        </form>
        <form action={deleteAnnouncement}>
          <input type="hidden" name="id" value={announcement.id} />
          <button
            type="submit"
            aria-label="حذف الإعلان"
            className="inline-flex size-9 items-center justify-center rounded-card text-muted hover:bg-stone/40 hover:text-danger"
          >
            <Icon name="trash" size={16} />
          </button>
        </form>
      </span>
    </li>
  );
}
