import type { Metadata } from "next";
import { Container } from "@/components/atoms/Layout";
import { Heading } from "@/components/atoms/Typography";
import { CartView } from "@/components/organisms/CartView";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "السلة",
  robots: { index: false },
};

export default async function CartPage() {
  const settings = await getSettings();

  return (
    <Container className="py-8 md:py-12">
      <Heading level="h1">سلّتك</Heading>
      <div className="mt-8">
        <CartView
          currency={settings.currency}
          deliveryFee={settings.deliveryFee}
          minOrder={settings.minOrder}
        />
      </div>
    </Container>
  );
}
