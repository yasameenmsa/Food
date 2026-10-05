import type { Metadata } from "next";
import { Container, Section } from "@/components/atoms/Layout";
import { ContactBlock } from "@/components/organisms/ContactBlock";
import { getOpenState, describeNextChange } from "@/lib/hours";
import { getSettings } from "@/lib/settings";

/**
 * ISR window. Every admin write calls `revalidateTag` so this is only the
 * backstop for a change that happens outside the admin — an edited row, or a
 * deploy. One hour keeps a stale menu from outliving its usefulness.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "تواصل معنا",
  description: "عنوان معجنات الزيتونة، ساعات العمل، وأرقام التواصل.",
};

export default async function ContactPage() {
  const settings = await getSettings();

  const now = new Date();
  const ordering = getOpenState(settings.orderingHours, now, settings.timezone);
  const openNote = ordering.isOpen
    ? null
    : describeNextChange(settings.orderingHours, now, settings.timezone, "kitchen");

  return (
    <Section>
      <Container>
        <ContactBlock settings={settings} isOpen={ordering.isOpen} openNote={openNote} />
      </Container>
    </Section>
  );
}
