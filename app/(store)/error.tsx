"use client";

import Link from "next/link";
import { Container } from "@/components/atoms/Layout";
import { Heading, Text } from "@/components/atoms/Typography";
import { Button } from "@/components/atoms/Button";

/**
 * Storefront error boundary. Scoped to the `(store)` group so it keeps the
 * navbar and footer — a customer who hits an error still needs a way to get to
 * the menu, not just a stack trace.
 */
export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="py-20 text-center">
      <Heading level="h1">تعذر تحميل هذه الصفحة</Heading>
      <Text tone="muted" className="mx-auto mt-3 max-w-md">
        جرّب مرة أخرى. إن استمرت المشكلة، اتصل بنا وسنخدمك مباشرة.
      </Text>
      {error.digest ? (
        <p className="nums mt-4 text-xs text-muted/70">
          رمز الخطأ: {error.digest}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>إعادة المحاولة</Button>
        <Link href="/menu">
          <Button variant="secondary">القائمة</Button>
        </Link>
      </div>
    </Container>
  );
}
