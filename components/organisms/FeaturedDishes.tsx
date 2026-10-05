import Link from "next/link";
import { Container, Section } from "@/components/atoms/Layout";
import { Heading, Text } from "@/components/atoms/Typography";
import { Icon } from "@/components/atoms/Icon";
import { buttonStyles } from "@/components/atoms/Button";
import { DishGrid } from "./DishGrid";
import type { CategoryDTO, DishDTO } from "@/types";

export function FeaturedDishes({
  dishes,
  categories,
  whatsappHrefFor,
  currency,
}: {
  dishes: DishDTO[];
  categories: CategoryDTO[];
  whatsappHrefFor?: (dish: DishDTO) => string | undefined;
  currency: string;
}) {
  if (dishes.length === 0) return null;

  return (
    <Section>
      <Container>
        <Heading level="h2">الأكثر طلبًا</Heading>
        <Text tone="muted" className="mt-2">
            المفضّلة لدى ضيوفنا — تنوّعت بين العجين المسلوك والجاف.
        </Text>

        <div className="mt-8">
          <DishGrid dishes={dishes} currency={currency} whatsappHrefFor={whatsappHrefFor} priorityFirst />
        </div>

        {categories.length > 0 ? (
          <div className="mt-10">
            <h3 className="text-lg font-bold">تصفّح حسب القسم</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/menu?category=${category.id}`}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-line bg-surface px-4 py-2 font-semibold text-brand transition-colors hover:border-brand"
                  >
                    {category.name}
                    <span className="nums text-xs text-muted">{category.dishCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-10 flex justify-center">
          <Link href="/menu" className={buttonStyles("secondary", "lg")}>
            <Icon name="utensils" size={18} />
            القائمة كاملة
          </Link>
        </div>
      </Container>
    </Section>
  );
}

export function SpecialsStrip({
  dishes,
  whatsappHrefFor,
  currency,
}: {
  dishes: DishDTO[];
  whatsappHrefFor?: (dish: DishDTO) => string | undefined;
  currency: string;
}) {
  if (dishes.length === 0) return null;

  return (
    <Section className="bg-surface">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Heading level="h2">عروض هذا الأسبوع</Heading>
            <Text tone="muted" className="mt-2">
              أسعار مخفّضة لفترة محدودة.
            </Text>
          </div>
          <Link href="/specials" className={buttonStyles("secondary", "md")}>
            كل العروض
            <Icon name="chevronLeft" size={18} />
          </Link>
        </div>

        <div className="mt-8">
          <DishGrid dishes={dishes} currency={currency} whatsappHrefFor={whatsappHrefFor} />
        </div>
      </Container>
    </Section>
  );
}