import type { Metadata } from "next";
import { Container } from "@/components/atoms/Layout";
import { Heading, Text } from "@/components/atoms/Typography";
import { SettingsForm } from "@/components/organisms/SettingsForm";
import { AnnouncementManager } from "@/components/organisms/AnnouncementManager";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import type { AnnouncementDTO } from "@/types";

export const metadata: Metadata = {
  title: "الإعدادات",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const [settings, rows] = await Promise.all([
    getSettings(),
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const announcements: AnnouncementDTO[] = rows.map((row) => ({
    id: row.id,
    body: row.body,
    active: row.active,
  }));

  return (
    <Container>
      <Heading level="h1">الإعدادات</Heading>
      <Text tone="muted" className="mt-1">
        كل ما يظهر على الموقع يُعدَّل من هنا.
      </Text>

      <div className="mt-6 space-y-6">
        <AnnouncementManager announcements={announcements} />
        <SettingsForm settings={settings} />
      </div>
    </Container>
  );
}
