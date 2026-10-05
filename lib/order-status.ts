import type { OrderStatus } from "@/types";

export type OrderStatusTone = "default" | "success" | "warning" | "danger" | "info";

/** Arabic labels + tone for the status badge. */
export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: OrderStatusTone }
> = {
  PENDING: { label: "بانتظار التأكيد", tone: "warning" },
  CONFIRMED: { label: "مؤكّد", tone: "info" },
  PREPARING: { label: "قيد التحضير", tone: "info" },
  READY: { label: "جاهز", tone: "success" },
  OUT_FOR_DELIVERY: { label: "في الطريق", tone: "info" },
  COMPLETED: { label: "مكتمل", tone: "success" },
  CANCELLED: { label: "ملغي", tone: "danger" },
};

export const ORDER_STATUS_VALUES = Object.keys(ORDER_STATUS_META) as OrderStatus[];
