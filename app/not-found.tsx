import Link from "next/link";
import { Container } from "@/components/atoms/Layout";
import { Heading, Text } from "@/components/atoms/Typography";
import { Button } from "@/components/atoms/Button";

/**
 * Root 404. `notFound()` is called from the menu list and the product page, so
 * without this the site fell through to Next's unbranded default — no chrome, no
 * Arabic, no way home.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center bg-background">
      <Container className="py-20 text-center">
        <p className="nums text-5xl font-bold text-brand/30">404</p>
        <Heading level="h1" className="mt-4">
          الصفحة غير موجودة
        </Heading>
        <Text tone="muted" className="mx-auto mt-3 max-w-md">
          ربما تغيّر الرابط أو حُذف الصنف. جرّب البحث في القائمة أو عد إلى الرئيسية.
        </Text>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/">
            <Button>الرئيسية</Button>
          </Link>
          <Link href="/menu">
            <Button variant="secondary">تصفّح القائمة</Button>
          </Link>
        </div>
      </Container>
    </main>
  );
}
