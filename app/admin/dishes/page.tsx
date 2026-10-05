import type { Metadata } from "next";
import { Container } from "@/components/atoms/Layout";
import { Heading, Text } from "@/components/atoms/Typography";
import { DishManager } from "@/components/organisms/DishManager";
import { getAllDishes, getCategories } from "@/lib/dishes";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "الأصناف",
  robots: { index: false, follow: false },
};

export default async function AdminDishesPage() {
  const [dishes, categories, settings] = await Promise.all([
    getAllDishes(),
    getCategories(),
    getSettings(),
  ]);

  return (
    <Container>
      <Heading level="h1">الأصناف</Heading>
      <Text tone="muted" className="mt-1">
        {dishes.length} صنف في {categories.length} أقسام.
      </Text>

      <div className="mt-6">
        <DishManager
          dishes={dishes}
          categories={categories}
          currency={settings.currency}
        />
      </div>
    </Container>
  );
}
