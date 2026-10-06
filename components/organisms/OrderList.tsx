"use client";

import { useOptimistic } from "react";
import { Badge } from "@/components/atoms/Badge";
import { Icon } from "@/components/atoms/Icon";
import { PriceTag } from "@/components/molecules/PriceTag";
import { updateOrderStatus, flagWhatsappSent } from "@/app/admin/actions";
import { formatDateTime } from "@/lib/datetime";
import { ORDER_STATUS_META } from "@/lib/order-status";
import type { OrderDTO, OrderStatus } from "@/types";

const STATUSES = Object.keys(ORDER_STATUS_META) as Array<keyof typeof ORDER_STATUS_META>;

/**
 * Status changes go through a form action rather than fetch, so they work
 * without JavaScript and are re-validated on the server.
 */
function OrderCard({ order, currency }: { order: OrderDTO; currency: string }) {
  const [optimistic, setOptimistic] = useOptimistic(
    order,
    (current: OrderDTO, next: OrderStatus) => ({ ...current, status: next }),
  );

  const meta = ORDER_STATUS_META[optimistic.status];

  return (
    <article className="rounded-lg border border-line bg-surface p-5 shadow-brand">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl leading-none">{optimistic.reference}</p>
          <p className="mt-1 text-sm text-muted">
            {formatDateTime(optimistic.createdAt)}
          </p>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">العميل</dt>
          <dd className="font-semibold">{optimistic.customerName}</dd>
        </div>
        <div>
          <dt className="text-muted">الهاتف</dt>
          <dd>
            <a href={`tel:${optimistic.phone}`} className="nums link-underline">
              {optimistic.phone}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-muted">النوع</dt>
          <dd className="font-semibold">
            {optimistic.type === "DELIVERY" ? "توصيل" : "استلام من المحل"}
          </dd>
        </div>
        {optimistic.address ? (
          <div>
            <dt className="text-muted">العنوان</dt>
            <dd className="font-semibold">{optimistic.address}</dd>
          </div>
        ) : null}
      </dl>

      <ul className="mt-4 flex flex-col divide-y divide-line border-y border-line text-sm">
        {optimistic.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3 py-2">
            <span>
              {item.dishName} <span className="nums text-muted">×{item.quantity}</span>
            </span>
            <PriceTag price={item.lineTotal} currency={currency} size="sm" />
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <dl className="text-sm">
          {optimistic.fee > 0 ? (
            <div className="flex gap-2 text-muted">
              <dt>رسوم التوصيل</dt>
              <dd>
                <PriceTag price={optimistic.fee} currency={currency} size="sm" />
              </dd>
            </div>
          ) : null}
          <div className="flex items-center gap-2 text-base font-bold">
            <dt>الإجمالي</dt>
            <dd>
              <PriceTag price={optimistic.total} currency={currency} />
            </dd>
          </div>
        </dl>

        <form
          action={(formData) => {
            setOptimistic(formData.get("status") as OrderStatus);
            updateOrderStatus(formData);
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="id" value={optimistic.id} />
          <label htmlFor={`status-${optimistic.id}`} className="sr-only">
            حالة الطلب {optimistic.reference}
          </label>
          <select
            id={`status-${optimistic.id}`}
            name="status"
            defaultValue={optimistic.status}
            className="h-11 rounded-card border-2 border-line bg-background px-3 font-semibold focus:border-brand"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_META[status].label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex h-11 items-center gap-2 rounded-card bg-brand px-4 text-sm font-bold text-brand-foreground transition-colors hover:bg-accent"
          >
            <Icon name="check" size={16} />
            تحديث
          </button>
        </form>
      </div>

      {optimistic.notes ? (
        <p className="mt-3 rounded-card bg-cream px-3 py-2 text-sm">
          <span className="font-bold">ملاحظات: </span>
          {optimistic.notes}
        </p>
      ) : null}

      <div className="mt-4 border-t border-line pt-3">
        {optimistic.whatsappSent ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-success">
            <Icon name="check" size={16} />
            أُرسل عبر واتساب
          </p>
        ) : (
          <form action={flagWhatsappSent}>
            <input type="hidden" name="id" value={optimistic.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-brand"
            >
              <Icon name="whatsapp" size={16} />
              تعليمه كمُرسَل عبر واتساب
            </button>
          </form>
        )}
      </div>
    </article>
  );
}

export function OrderList({
  orders,
  currency,
}: {
  orders: OrderDTO[];
  currency: string;
}) {
  return (
    <ul className="flex flex-col gap-4">
      {orders.map((order) => (
        <li key={order.id}>
          <OrderCard order={order} currency={currency} />
        </li>
      ))}
    </ul>
  );
}
