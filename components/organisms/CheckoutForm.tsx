"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Input, Textarea } from "@/components/atoms/Field";
import { FormAlert } from "@/components/molecules/FormField";
import { PriceTag } from "@/components/molecules/PriceTag";
import { useCart } from "@/components/molecules/cart-context";
import type { FormState } from "@/types";

export type CheckoutFormProps = {
  submitOrder: (formData: FormData) => Promise<FormState>;
  deliveryFee: number;
  minOrder: number;
  currency: string;
  acceptsDelivery: boolean;
};

/**
 * Client form, but every price and availability check happens in the server
 * action. Nothing the browser sends is trusted for money.
 */
export function CheckoutForm({
  submitOrder,
  deliveryFee,
  minOrder,
  currency,
  acceptsDelivery,
}: CheckoutFormProps) {
  const { lines, subtotal, count, ready } = useCart();
  const [state, formAction, pending] = useActionState(
    async (_previous: FormState, formData: FormData) => submitOrder(formData),
    { ok: false } satisfies FormState,
  );

  // The cart lives in localStorage, so only the browser can serialise it. The
  // server re-resolves every id against the database before charging anything.
  // The cart is emptied by the confirmation page, once the order exists.
  const linesParam = lines.map((line) => `${line.dishId}:${line.quantity}`).join(",");
  const total = subtotal + deliveryFee;
  const belowMinimum = subtotal < minOrder;
  const empty = ready && lines.length === 0;

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <input type="hidden" name="lines" value={linesParam} />

      <div className="space-y-6">
        {state.message ? (
          <FormAlert tone={state.ok ? "success" : "danger"}>{state.message}</FormAlert>
        ) : null}

        {empty ? (
          <FormAlert tone="info">
            سلّتك فارغة. <Link href="/menu">تصفّح القائمة</Link> وأضف أصنافًا أولًا.
          </FormAlert>
        ) : null}

        <fieldset className="rounded-lg border border-line bg-surface p-5 shadow-brand">
          <legend className="px-2 font-display text-xl">نوع الطلب</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-card border-2 border-line p-4 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
              <input
                type="radio"
                name="type"
                value="delivery"
                defaultChecked
                disabled={!acceptsDelivery}
                className="size-5 accent-(--color-brand)"
              />
              <span>
                <span className="block font-bold">توصيل</span>
                <span className="text-sm text-muted">نوصل إلى عنوانك</span>
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-card border-2 border-line p-4 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
              <input
                type="radio"
                name="type"
                value="pickup"
                className="size-5 accent-(--color-brand)"
              />
              <span>
                <span className="block font-bold">استلام من المحل</span>
                <span className="text-sm text-muted">جاهز خلال 15–20 دقيقة</span>
              </span>
            </label>
          </div>
          {state.errors?.type ? (
            <p className="mt-2 text-sm font-semibold text-danger">{state.errors.type}</p>
          ) : null}
        </fieldset>

        <fieldset className="space-y-4 rounded-lg border border-line bg-surface p-5 shadow-brand">
          <legend className="px-2 font-display text-xl">بيانات التواصل</legend>

          <Input
            label="الاسم"
            name="name"
            required
            autoComplete="name"
            error={state.errors?.name}
          />
          <Input
            label="رقم الهاتف"
            name="phone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            placeholder="05X XXX XXXX"
            hint="سنستخدمه للتواصل عند تجهيز الطلب."
            error={state.errors?.phone}
          />
          <Input
            label="العنوان"
            name="address"
            autoComplete="street-address"
            hint="مطلوب لطلبات التوصيل فقط."
            error={state.errors?.address}
          />
          <Textarea
            label="ملاحظات"
            name="notes"
            rows={3}
            placeholder="بدون بصل، درجة حرارة متوسطة…"
            error={state.errors?.notes}
          />
        </fieldset>
      </div>

      <aside className="h-fit rounded-lg border border-line bg-surface p-5 shadow-brand lg:sticky lg:top-20">
        <h2 className="font-display text-xl">ملخّص الطلب</h2>
        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt>
              المجموع (<span className="nums">{count}</span> قطعة)
            </dt>
            <dd>
              <PriceTag price={subtotal} currency={currency} size="sm" />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>رسوم التوصيل</dt>
            <dd>
              <PriceTag price={deliveryFee} currency={currency} size="sm" />
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
            <dt>الإجمالي</dt>
            <dd>
              <PriceTag price={total} currency={currency} />
            </dd>
          </div>
        </dl>

        <Button
          type="submit"
          size="lg"
          loading={pending}
          disabled={!ready || belowMinimum}
          className="mt-5 w-full"
        >
          <Icon name="check" size={20} />
          تأكيد الطلب
        </Button>

        {belowMinimum ? (
          <p className="mt-3 text-center text-sm font-semibold text-warning">
            الحد الأدنى للطلب هو <PriceTag price={minOrder} currency={currency} size="sm" />.
          </p>
        ) : null}

        <p className="mt-4 text-center text-xs text-muted">
          عند التأكيد ستفتح محادثة واتساب برسالة الطلب جاهزة.
        </p>
      </aside>
    </form>
  );
}
