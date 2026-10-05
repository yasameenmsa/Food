import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartClearer } from "@/components/organisms/CartClearer";
import { OrderConfirmation } from "@/components/organisms/OrderConfirmation";
import { getOrderByReference } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { orderMessage, orderWhatsappLink } from "@/lib/whatsapp";
import type { CartLineDTO } from "@/types";

export const metadata: Metadata = {
  title: "تم استلام طلبك",
  robots: { index: false },
};

export default async function OrderConfirmationPage({
  params,
}: PageProps<"/order/[reference]">) {
  const { reference } = await params;
  const [order, settings] = await Promise.all([
    getOrderByReference(reference),
    getSettings(),
  ]);

  if (!order) notFound();

  // Rebuild the message from the stored order rather than trusting the client.
  const lines: CartLineDTO[] = order.items.map((item) => ({
    dishId: item.dishId ?? "",
    slug: "",
    name: item.dishName,
    image: null,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  }));

  const whatsappHref = orderWhatsappLink(
    settings.whatsapp,
    orderMessage({
      reference: order.reference,
      kind: order.type === "DELIVERY" ? "delivery" : "pickup",
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      notes: order.notes,
      lines,
      subtotal: order.subtotal,
      fee: order.fee,
      total: order.total,
      currency: settings.currency,
    }),
  );

  return (
    <>
      <CartClearer />
      <OrderConfirmation
        order={order}
        currency={settings.currency}
        whatsappHref={whatsappHref}
      />
    </>
  );
}
