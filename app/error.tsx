"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/atoms/Layout";
import { Heading, Text } from "@/components/atoms/Typography";
import { Button } from "@/components/atoms/Button";

/**
 * Root error boundary.
 *
 * Without this, any thrown error in any page replaced the whole document with
 * Next's raw error page — losing the navbar, the footer and the Arabic. `reset`
 * retries the render without a full reload, which is usually enough when the
 * cause was one slow query.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in the server log, which is where a digest can be looked up.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center bg-background">
      <Container className="py-20 text-center">
        <Heading level="h1">صار خطأ غير متوقع</Heading>
        <Text tone="muted" className="mx-auto mt-3 max-w-md">
          نأسف لذلك. جرّب مرة أخرى، وإن تكرر الأمرتواصل معنا عبر واتساب.
        </Text>
        {error.digest ? (
          <p className="nums mt-4 text-xs text-muted/70">
            رمز الخطأ: {error.digest}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>إعادة المحاولة</Button>
          <Link href="/">
            <Button variant="secondary">الرئيسية</Button>
          </Link>
        </div>
      </Container>
    </main>
  );
}
