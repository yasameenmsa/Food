"use client";

import { useActionState } from "react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Input, Textarea } from "@/components/atoms/Field";
import { FormAlert } from "@/components/molecules/FormField";
import { DAY_NAMES_AR } from "@/lib/hours";
import { saveSettings } from "@/app/admin/actions";
import type { FormState } from "@/types";
import type { Settings } from "@/lib/settings";

type Hours = Record<string, { open: string; close: string } | null>;

function HoursGrid({
  legend,
  prefix,
  hours,
  hint,
}: {
  legend: string;
  prefix: string;
  hours: Hours;
  hint: string;
}) {
  return (
    <fieldset className="rounded-card border-2 border-line p-4">
      <legend className="px-2 font-bold">{legend}</legend>
      <p className="mb-3 text-sm text-muted">{hint}</p>
      <ul className="flex flex-col gap-2">
        {DAY_NAMES_AR.map((day, index) => {
          const window = hours[String(index)] ?? null;
          return (
            <li key={day} className="flex flex-wrap items-center gap-2">
              <span className="w-16 shrink-0 text-sm font-semibold">{day}</span>
              <label className="sr-only" htmlFor={`${prefix}Open-${day}`}>
                {legend} — {day} — يفتح
              </label>
              <input
                id={`${prefix}Open-${day}`}
                name={`${prefix}Open[${index}]`}
                type="time"
                defaultValue={window?.open ?? ""}
                className="h-11 rounded-card border-2 border-line bg-background px-3 text-sm focus:border-brand"
              />
              <span aria-hidden className="text-muted">
                –
              </span>
              <label className="sr-only" htmlFor={`${prefix}Close-${day}`}>
                {legend} — {day} — يغلق
              </label>
              <input
                id={`${prefix}Close-${day}`}
                name={`${prefix}Close[${index}]`}
                type="time"
                defaultValue={window?.close ?? ""}
                className="h-11 rounded-card border-2 border-line bg-background px-3 text-sm focus:border-brand"
              />
              <span className="text-xs text-muted">
                {!window ? "مغلق" : window.close <= window.open ? "عبر الليل" : ""}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted">
        اترك اليوم فارغًا ليُعتبر مغلقًا.
      </p>
    </fieldset>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveSettings, {
    ok: false,
  });

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? <FormAlert tone={state.ok ? "success" : "danger"}>{state.message}</FormAlert> : null}

      <fieldset className="rounded-lg border border-line bg-surface p-5 shadow-brand">
        <legend className="px-2 font-display text-xl">الهوية</legend>
        <div className="mt-2 grid gap-4 md:grid-cols-2">
          <Input label="اسم المحل" name="name" required defaultValue={settings.name} error={state.errors?.name} />
          <Input label="الجملة التعريفية" name="tagline" defaultValue={settings.tagline ?? ""} />
          <div className="md:col-span-2">
            <Textarea label="النبذة" name="story" rows={3} defaultValue={settings.story ?? ""} />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-surface p-5 shadow-brand">
        <legend className="px-2 font-display text-xl">التواصل</legend>
        <div className="mt-2 grid gap-4 md:grid-cols-2">
          <Input
            label="واتساب"
            name="whatsapp"
            required
            dir="ltr"
            defaultValue={settings.whatsapp}
            error={state.errors?.whatsapp}
          />
          <Input label="الهاتف" name="phone" dir="ltr" defaultValue={settings.phone ?? ""} />
          <Input label="إنستغرام" name="instagram" dir="ltr" defaultValue={settings.instagram ?? ""} hint="بدون @" />
          <Input label="فيسبوك" name="facebook" dir="ltr" defaultValue={settings.facebook ?? ""} />
          <Input label="تيك توك" name="tiktok" dir="ltr" defaultValue={settings.tiktok ?? ""} />
          <Input label="البريد الإلكتروني" name="email" type="email" dir="ltr" defaultValue={settings.email ?? ""} />
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-surface p-5 shadow-brand">
        <legend className="px-2 font-display text-xl">العنوان والتوصيل</legend>
        <div className="mt-2 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input label="العنوان" name="address" required defaultValue={settings.address} error={state.errors?.address} />
          </div>
          <Input label="المدينة" name="city" defaultValue={settings.city ?? ""} />
          <Input
            label="رابط الخريطة"
            name="mapUrl"
            dir="ltr"
            defaultValue={settings.mapUrl ?? ""}
          />
          <Input
            label="مناطق التوصيل"
            name="deliveryAreas"
            defaultValue={settings.deliveryAreas ?? ""}
          />
          <Input
            label={`رسوم التوصيل (${settings.currency})`}
            name="deliveryFee"
            type="number"
            step="0.5"
            min="0"
            inputMode="decimal"
            defaultValue={String(settings.deliveryFee / 100)}
          />
          <Input
            label={`الحد الأدنى للطلب (${settings.currency})`}
            name="minOrder"
            type="number"
            step="0.5"
            min="0"
            inputMode="decimal"
            defaultValue={String(settings.minOrder / 100)}
          />
          <Input
            label="مدة التوصيل بالدقائق"
            name="etaMinutes"
            type="number"
            min="0"
            inputMode="numeric"
            defaultValue={settings.etaMinutes === null ? "" : String(settings.etaMinutes)}
            error={state.errors?.etaMinutes}
          />
          <Input
            label="المنطقة الزمنية"
            name="timezone"
            dir="ltr"
            defaultValue={settings.timezone}
            hint="مثل Asia/Jerusalem"
            error={state.errors?.timezone}
          />
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-surface p-5 shadow-brand">
        <legend className="px-2 font-display text-xl">الأوقات</legend>
        <div className="mt-2 grid gap-4 md:grid-cols-2">
          <HoursGrid
            legend="أوقات الدوام"
            prefix=""
            hours={settings.openingHours}
            hint="متى يفتح المحل."
          />
          <HoursGrid
            legend="أوقات استقبال الطلبات"
            prefix="order"
            hours={settings.orderingHours}
            hint="متى تقبل الطلبات. يُرفض الطلب خارج هذه الأوقات."
          />
        </div>
      </fieldset>

      <div className="sticky bottom-4 z-10">
        <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">
          <Icon name="check" size={20} />
          حفظ الإعدادات
        </Button>
      </div>
    </form>
  );
}
