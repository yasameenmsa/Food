import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/atoms/Layout";
import { Heading } from "@/components/atoms/Typography";
import { buttonStyles } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { CheckoutForm } from "@/components/organisms/CheckoutForm";
import { submitOrder } from "./actions";
import { getSettings } from "@/lib/settings";
import { getOpenState, describeNextChange } from "@/lib/hours";

export const metadata: Metadata = {
  title: "إتمام الطلب",
  robots: { index: false },
};

export default async function OrderPage() {
  const settings = await getSettings();

  const now = new Date();
  const ordering = getOpenState(settings.orderingHours, now, settings.timezone);

  return (
    <Container className="py-8 md:py-12">
      <Heading level="h1">إتمام الطلب</Heading>

      {!ordering.isOpen ? (
        <div
          role="alert"
          className="mt-6 rounded-card border-2 border-warning/40 bg-warning/10 px-4 py-3 font-semibold text-warning"
        >
          <Icon name="clock" size={18} className="me-2 inline" />
          {describeNextChange(settings.orderingHours, now, settings.timezone, "kitchen")}
        </div>
      ) : null}

      <div className="mt-8">
        <CheckoutForm
          submitOrder={submitOrder}
          deliveryFee={settings.deliveryFee}
          minOrder={settings.minOrder}
          currency={settings.currency}
          acceptsDelivery={settings.deliveryFee > 0 || Boolean(settings.deliveryAreas)}
        />
      </div>

      <p className="mt-8 text-sm text-muted">
        غيّرت رأيك؟{" "}
        <Link href="/cart" className="link-underline font-bold text-brand">
          عد إلى السلة
        </Link>{" "}
        أو{" "}
        <Link href="/menu" className="link-underline font-bold text-brand">
          تصفّح القائمة
        </Link>
        .
      </p>
    </Container>
  );
}
