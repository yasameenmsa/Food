import type { Metadata } from "next";
import { Container, Section } from "@/components/atoms/Layout";
import { ContactBlock } from "@/components/organisms/ContactBlock";
import { getOpenState, describeNextChange } from "@/lib/hours";
import { getSettings } from "@/lib/settings";

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
