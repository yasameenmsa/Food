import Link from "next/link";
import { Container } from "@/components/atoms/Layout";
import { Heading, Text, Numeral } from "@/components/atoms/Typography";
import { Icon } from "@/components/atoms/Icon";
import { Badge } from "@/components/atoms/Badge";
import { buttonStyles } from "@/components/atoms/Button";
import { PriceTag } from "@/components/molecules/PriceTag";
import { CopyButton } from "@/components/molecules/CopyButton";
import type { OrderDTO } from "@/types";

export type OrderConfirmationProps = {
  order: OrderDTO;
  currency: string;
  /** wa.me link carrying the prefilled order message. */
  whatsappHref: string;
};

export function OrderConfirmation({ order, currency, whatsappHref }: OrderConfirmationProps) {
  return (
    <Container className="py-10 md:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-line bg-surface p-6 shadow-brand md:p-8">
          <span className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
            <Icon name="check" size={28} />
          </span>

          <Heading level="h1" className="mt-5">
            استلمنا طلبك
          </Heading>
          <Text tone="muted" className="mt-2">
            رقم الطلب{" "}
            <Numeral className="font-bold text-foreground">{order.reference}</Numeral> — احتفظ
            به للمتابعة.
          </Text>

          <dl className="mt-6 flex flex-col gap-3 rounded-card bg-cream p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">النوع</dt>
              <dd className="font-semibold">
                {order.type === "DELIVERY" ? "توصيل" : "استلام من المحل"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">الاسم</dt>
              <dd className="font-semibold">{order.customerName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">الهاتف</dt>
              <dd>
                <Numeral className="font-semibold">{order.phone}</Numeral>
              </dd>
            </div>
            {order.address ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">العنوان</dt>
                <dd className="font-semibold">{order.address}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-muted">الحالة</dt>
              <dd>
                <Badge tone="warning">بانتظار التأكيد</Badge>
              </dd>
            </div>
          </dl>

          <h2 className="mt-6 font-display text-xl">الأصناف</h2>
          <ul className="mt-3 flex flex-col divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-2 text-sm">
                <span>
                  {item.dishName} <span className="nums text-muted">×{item.quantity}</span>
                </span>
                <PriceTag price={item.lineTotal} currency={currency} size="sm" />
              </li>
            ))}
          </ul>

          <dl className="mt-4 flex flex-col gap-1 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt>المجموع</dt>
              <dd>
                <PriceTag price={order.subtotal} currency={currency} size="sm" />
              </dd>
            </div>
            {order.fee > 0 ? (
              <div className="flex justify-between">
                <dt>رسوم التوصيل</dt>
                <dd>
                  <PriceTag price={order.fee} currency={currency} size="sm" />
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-bold">
              <dt>الإجمالي</dt>
              <dd>
                <PriceTag price={order.total} currency={currency} />
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonStyles("primary", "lg")} flex-1`}
            >
              <Icon name="whatsapp" size={20} />
              إرسال الطلب عبر واتساب
            </a>
            <Link href="/menu" className={buttonStyles("secondary", "lg")}>
              العودة للقائمة
            </Link>
          </div>

          <div className="mt-4 flex justify-center">
            <CopyButton value={order.reference} label="نسخ رقم الطلب" />
          </div>
        </div>

        <Text tone="muted" size="sm" className="mt-6 text-center">
          إن لم تصلنا رسالة من واتساب، اتصل بنا مباشرة على رقم المحل وسنتحقق من طلبك.
        </Text>
      </div>
    </Container>
  );
}