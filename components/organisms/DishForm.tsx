"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Input, Textarea, Select, Checkbox } from "@/components/atoms/Field";
import { FormAlert } from "@/components/molecules/FormField";
import { saveDish, type DishFormState } from "@/app/admin/actions";
import type { CategoryDTO, DishDTO } from "@/types";

const EMPTY = {
  id: "",
  name: "",
  slug: "",
  description: "",
  price: "",
  categoryId: "",
  sortOrder: "0",
  alt: "",
};

function initialValue(dish: DishDTO | null, categories: CategoryDTO[]) {
  if (!dish) {
    return { ...EMPTY, categoryId: categories[0]?.id ?? "" };
  }
  return {
    id: dish.id,
    name: dish.name,
    slug: dish.slug,
    description: dish.description ?? "",
    price: String(dish.price / 100),
    categoryId: dish.categoryId,
    sortOrder: String(dish.sortOrder),
    alt: dish.image?.alt ?? "",
  };
}

/**
 * Create and edit share one form. `key` on the <form> resets it when the parent
 * swaps in a different dish, which a client component cannot do itself.
 */
export function DishForm({
  dish,
  categories,
  editing,
  onCancelEdit,
}: {
  dish: DishDTO | null;
  categories: CategoryDTO[];
  editing: boolean;
  onCancelEdit: () => void;
}) {
  const initial = initialValue(dish, categories);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState<DishFormState, FormData>(
    saveDish,
    { ok: false },
  );

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-lg border border-line bg-surface p-5 shadow-brand"
    >
      <h2 className="font-display text-xl">{editing ? "تعديل صنف" : "صنف جديد"}</h2>

      {state.message ? (
        <div className="mt-4">
          <FormAlert tone={state.ok ? "success" : "danger"}>{state.message}</FormAlert>
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        {editing ? <input type="hidden" name="id" value={initial.id} /> : null}

        <Input label="الاسم" name="name" required defaultValue={initial.name} error={state.errors?.name} />

        <Input
          label="الرابط (slug)"
          name="slug"
          defaultValue={initial.slug}
          hint="اتركه فارغًا ليُولَّد تلقائيًا من الاسم."
          className="ltr-run"
        />

        <Select
          label="القسم"
          name="categoryId"
          required
          defaultValue={initial.categoryId}
          error={state.errors?.categoryId}
          options={categories.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
        />

        <Input
          label="السعر (شيكل)"
          name="price"
          type="number"
          step="0.5"
          min="0"
          required
          inputMode="decimal"
          defaultValue={initial.price}
          error={state.errors?.price}
        />

        <Textarea
          label="الوصف"
          name="description"
          rows={3}
          defaultValue={initial.description}
          error={state.errors?.description}
        />

        <div className="rounded-card border-2 border-dashed border-line p-4">
          <div className="flex items-start gap-4">
            {dish?.image ? (
              <div className="size-24 shrink-0 overflow-hidden rounded-card border border-line">
                {/* Plain <img>: this is the admin preview of an arbitrary upload,
                    and next/image would add nothing here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dish.image.src}
                  alt={dish.image.alt}
                  width={96}
                  height={96}
                  className="size-full object-cover"
                />
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              <Input
                label={dish?.image ? "استبدال الصورة" : "صورة الصنف"}
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                hint="JPG أو PNG أو WebP، حتى ٢ ميجابايت."
                error={state.errors?.photo}
              />
              <div className="mt-3">
                <Input
                  label="وصف الصورة لقارئ الشاشة (اختياري)"
                  name="alt"
                  defaultValue={initial.alt}
                  hint="إذا تُرك فارغًا يُستخدم اسم الصنف."
                />
              </div>
            </div>
          </div>
        </div>

        <Input
          label="الترتيب داخل القسم"
          name="sortOrder"
          type="number"
          min="0"
          max="9999"
          step="1"
          inputMode="numeric"
          defaultValue={initial.sortOrder}
          hint="الأصغر يظهر أولًا."
          error={state.errors?.sortOrder}
        />

        <div className="flex flex-wrap gap-5">
          <Checkbox name="available" label="متاح" defaultChecked />
          <Checkbox name="featured" label="من الأكثر طلبًا" />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>
          <Icon name="check" size={18} />
          {editing ? "حفظ التعديلات" : "إضافة الصنف"}
        </Button>
        {editing ? (
          <Button type="button" variant="secondary" onClick={onCancelEdit}>
            إلغاء
          </Button>
        ) : null}
      </div>
    </form>
  );
}
