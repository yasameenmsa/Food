import type { Metadata } from "next";
import { Cairo, Lalezar } from "next/font/google";
import "./globals.css";

/* brand-style.md: Lalezar for headings (closest free match to the logotype),
   Cairo for body and UI. */
const body = Cairo({
  variable: "--font-body",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const display = Lalezar({
  variable: "--font-display",
  subsets: ["arabic", "latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "معجنات الزيتونة",
    template: "%s | معجنات الزيتونة",
  },
  description: "بيتزا وصفيحة ومعجنات على الحطب — اطلب توصيل أو استلام.",
  openGraph: {
    type: "website",
    locale: "ar_IL",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${body.variable} ${display.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}