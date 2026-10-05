"use client";

import { useActionState, useState } from "react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { PriceTag } from "@/components/molecules/PriceTag";
import { DishImage } from "@/components/molecules/DishImage";
import { FormAlert } from "@/components/molecules/FormField";
import { Input, Select } from "@/components/atoms/Field";
import { DishForm } from "./DishForm";
import {
  deleteDish,
  saveSpecial,
  endSpecial,
  toggleDishAvailability,
  updateDishOrder,
} from "@/app/admin/actions";
import type { CategoryDTO, DishDTO, FormState } from "@/types";

/**
 * Move a dish up or down within its category.
 *
 * Drag-and-drop was rejected here on purpose: the owner may well be editing on a
 * phone, where a drag handle is fiddly and these buttons are not. Reordering is
 * expressed as `sortOrder - 1` / `sortOrder + 1`, so two dishes can briefly
 * share a position — `id` is the tiebreak in the query, which keeps the result
 * stable rather than shuffling.
 */
function OrderControls({ dish }: { dish: DishDTO }) {
  return (
    <div className="flex items-center gap-1 text-xs text-muted">
      <span className="font-bold text-foreground/70">الترتيب</span>
      <form action={updateDishOrder}>
        <input type="hidden" name="id" value={dish.id} />
        <input type="hidden" name="sortOrder" value={dish.sortOrder - 1} />
        <button
          type="submit"
          disabled={dish.sortOrder <= 0}
          aria-label={`تقديم ${dish.name} في القائمة`}
          className="inline-flex size-8 items-center justify-center rounded-card transition-colors hover:bg-stone/40 disabled:opacity-30"
        >
          <Icon name="chevronUp" size={16} />
        </button>
      </form>
      <span className="nums w-6 text-center font-bold">{dish.sortOrder}</span>
      <form action={updateDishOrder}>
        <input type="hidden" name="id" value={dish.id} />
        <input type="hidden" name="sortOrder" value={dish.sortOrder + 1} />
        <button
          type="submit"
          aria-label={`تأخير ${dish.name} في القائمة`}
          className="inline-flex size-8 items-center justify-center rounded-card transition-colors hover:bg-stone/40"
        >
          <Icon name="chevronDown" size={16} />
        </button>
      </form>
    </div>
  );
}

function SpecialForm({
  dishes,
  currency,
}: {
  dishes: DishDTO[];
  currency: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    saveSpecial,
    {
      ok: false,
    },
  );

  return (
    <form
      action={formAction}
      className="mt-4 rounded-card border-2 border-dashed border-line p-4"
    >
      <h3 className="font-bold">إضافة عرض خاص</h3>

      {state.message ? (
        <div className="mt-3">
          <FormAlert tone={state.ok ? "success" : "danger"}>
            {state.message}
          </FormAlert>
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Select
          label="الصنف"
          name="dishId"
          required
          options={dishes.map((dish) => ({ value: dish.id, label: dish.name }))}
          error={state.errors?.dishId}
        />
        <Input
          label={`السعر بعد الخصم (${currency})`}
          name="offerPrice"
          type="number"
          step="0.5"
          min="0"
          required
          inputMode="decimal"
          error={state.errors?.offerPrice}
        />
        <Input
          label="نص العرض (اختياري)"
          name="label"
          placeholder="عرض العشاء"
        />
        <Input
          label="ينتهي في (اختياري)"
          name="expiresAt"
          type="datetime-local"
        />
      </div>

      <Button type="submit" size="sm" loading={pending} className="mt-3">
        <Icon name="flame" size={16} />
        أضف العرض
      </Button>
    </form>
  );
}

export function DishManager({
  dishes,
  categories,
  currency,
}: {
  dishes: DishDTO[];
  categories: CategoryDTO[];
  currency: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = dishes.find((dish) => dish.id === editingId) ?? null;
  const [showSpecialForm, setShowSpecialForm] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-3">
        {dishes.length === 0 ? (
          <p className="rounded-lg border border-line bg-surface p-8 text-center text-muted">
            لا توجد أصناف. أضف أول صنف من النموذج.
          </p>
        ) : null}

        {dishes.map((dish) => (
          <article
            key={dish.id}
            className="flex gap-4 rounded-lg border border-line bg-surface p-3 shadow-brand"
          >
            <div className="size-20 shrink-0 overflow-hidden rounded-card">
              <DishImage image={dish.image} name={dish.name} sizes="80px" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold leading-snug">{dish.name}</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    {dish.categoryName} ·{" "}
                    <span className="ltr-run">{dish.slug}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {dish.featured ? <Badge tone="info">مميّز</Badge> : null}
                  {dish.special ? <Badge tone="accent">عرض</Badge> : null}
                  <Badge tone={dish.available ? "success" : "danger"}>
                    {dish.available ? "متاح" : "غير متاح"}
                  </Badge>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <OrderControls dish={dish} />

                <PriceTag
                  price={dish.currentPrice}
                  originalPrice={dish.special ? dish.price : null}
                  currency={currency}
                  size="sm"
                />

                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditingId(dish.id)}
                    aria-label={`تعديل ${dish.name}`}
                  >
                    تعديل
                  </Button>

                  <form action={toggleDishAvailability}>
                    <input type="hidden" name="id" value={dish.id} />
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center rounded-card px-3 text-sm font-bold text-brand transition-colors hover:bg-stone/40"
                    >
                      {dish.available ? "إخفاء" : "إظهار"}
                    </button>
                  </form>

                  <form action={deleteDish}>
                    <input type="hidden" name="id" value={dish.id} />
                    <button
                      type="submit"
                      aria-label={`حذف ${dish.name}`}
                      className="inline-flex size-9 items-center justify-center rounded-card text-muted transition-colors hover:bg-stone/40 hover:text-danger"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </form>
                </div>
              </div>

              {dish.special ? (
                <form action={endSpecial} className="mt-2 inline-block">
                  <input type="hidden" name="id" value={dish.special.id} />
                  <button
                    type="submit"
                    className="text-xs font-semibold text-muted underline underline-offset-4 hover:text-danger"
                  >
                    إنهاء العرض (خصم {dish.special.offerPrice / 100}
                    {dish.special.expiresAt
                      ? ` — حتى ${new Date(dish.special.expiresAt).toLocaleDateString("ar-EG")}`
                      : ""}
                    )
                  </button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <aside className="h-fit space-y-4 lg:sticky lg:top-20">
        {/* Remounting on `editing.id` resets every field when the selection changes. */}
        <DishForm
          key={editing?.id ?? "new"}
          dish={editing}
          categories={categories}
          editing={Boolean(editing)}
          onCancelEdit={() => setEditingId(null)}
        />

        {showSpecialForm ? (
          <SpecialForm dishes={dishes} currency={currency} />
        ) : (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setShowSpecialForm(true)}
          >
            <Icon name="flame" size={18} />
            إدارة العروض
          </Button>
        )}
      </aside>
    </div>
  );
}
