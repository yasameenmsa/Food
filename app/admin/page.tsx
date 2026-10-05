import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/atoms/Layout";
import { Heading, Text } from "@/components/atoms/Typography";
import { Icon } from "@/components/atoms/Icon";
import { OrderList } from "@/components/organisms/OrderList";
import { getOrders } from "@/lib/orders";
import { ORDER_STATUS_META, ORDER_STATUS_VALUES } from "@/lib/order-status";
import { getSettings } from "@/lib/settings";
import type { OrderStatus } from "@/types";

export const metadata: Metadata = {
  title: "الطلبات",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;
  const raw = typeof params.status === "string" ? params.status : "";
  const status = (ORDER_STATUS_VALUES as string[]).includes(raw)
    ? (raw as OrderStatus)
    : undefined;

  const [orders, settings] = await Promise.all([getOrders(status), getSettings()]);

  const filters: { value?: OrderStatus; label: string }[] = [
    { label: "الكل" },
    ...ORDER_STATUS_VALUES.map((value) => ({
      value,
      label: ORDER_STATUS_META[value].label,
    })),
  ];

  return (
    <Container>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Heading level="h1">الطلبات</Heading>
          <Text tone="muted" className="mt-1">
            {orders.length === 0
              ? "لا توجد طلبات في هذا التصنيف."
              : `${orders.length} طلب.`}
          </Text>
        </div>
      </div>

      <nav aria-label="تصفية الطلبات" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const active = (filter.value ?? undefined) === status;
            return (
              <li key={filter.label}>
                <Link
                  href={filter.value ? `/admin?status=${filter.value}` : "/admin"}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "inline-flex h-11 items-center gap-2 rounded-full border-2 px-4 text-sm font-bold transition-colors",
                    active
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-line bg-surface text-brand hover:border-brand",
                  ].join(" ")}
                >
                  {active ? <Icon name="check" size={14} /> : null}
                  {filter.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-8">
        {orders.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface p-10 text-center">
            <Icon name="dashboard" size={36} className="mx-auto text-olive/30" />
            <p className="mt-3 font-bold">لا يوجد شيء هنا بعد.</p>
          </div>
        ) : (
          <OrderList orders={orders} currency={settings.currency} />
        )}
      </div>
    </Container>
  );
}
