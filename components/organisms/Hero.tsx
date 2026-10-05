import Link from "next/link";
import { Container } from "@/components/atoms/Layout";
import { Icon } from "@/components/atoms/Icon";
import { Button } from "@/components/atoms/Button";
import type { Settings } from "@/lib/settings";

export type HeroProps = {
  settings: Settings;
  /** wa.me link with a greeting prefilled. */
  whatsappHref: string;
  isOpen: boolean;
  /** e.g. "نفتح غدًا الساعة 11:00" */
  openNote: string | null;
  deliveryAreas: string | null;
};

export function Hero({
  settings,
  whatsappHref,
  isOpen,
  openNote,
  deliveryAreas,
}: HeroProps) {
  return (
    <section className="bg-gradient-to-b from-cream to-surface">
      <Container className="py-16 md:py-24">
        <div className="max-w-2xl">
          <p
            className={[
              "inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-sm font-bold",
              isOpen
                ? "border-success/40 bg-success/10 text-success"
                : "border-warning/40 bg-warning/10 text-warning",
            ].join(" ")}
          >
            <Icon name={isOpen ? "check" : "clock"} size={16} />
            {isOpen ? "مفتوح الآن" : (openNote ?? "مغلق حاليًا")}
          </p>

          <h1 className="mt-5 font-display text-4xl leading-[1.2] md:text-6xl">
            {settings.tagline ?? "عجائن زيتونية تُخبز كل صباح"}
          </h1>

          {settings.story ? (
            <p className="mt-5 max-w-xl text-lg opacity-90">{settings.story}</p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/menu"
              className="inline-flex h-13 items-center gap-2 rounded-card bg-brand px-6 font-bold text-brand-foreground transition-colors hover:bg-olive-soft"
            >
              <Icon name="utensils" size={20} />
              تصفّح القائمة
            </Link>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-13 items-center gap-2 rounded-card border-2 border-brand px-6 font-bold text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
            >
              <Icon name="whatsapp" size={20} />
              اطلب عبر واتساب
            </a>
          </div>

          <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Icon name="mapPin" size={18} className="text-gold" />
              <div>
                <dt className="sr-only">التوصيل</dt>
                <dd>{deliveryAreas ?? settings.address}</dd>
              </div>
            </div>
            {settings.minOrder > 0 ? (
              <div className="flex items-center gap-2">
                <Icon name="cart" size={18} className="text-gold" />
                <div>
                  <dt className="sr-only">الحد الأدنى للطلب</dt>
                  <dd>
                    الحد الأدنى للطلب{" "}
                    <span className="nums">₪{settings.minOrder / 100}</span>
                  </dd>
                </div>
              </div>
            ) : null}
            {settings.etaMinutes ? (
              <div className="flex items-center gap-2">
                <Icon name="clock" size={18} className="text-gold" />
                <div>
                  <dt className="sr-only">مدة التوصيل</dt>
                  <dd>
                    التوصيل خلال{" "}
                    <span className="nums">
                      {settings.etaMinutes}–{settings.etaMinutes + 20}
                    </span>{" "}
                    دقيقة
                  </dd>
                </div>
              </div>
            ) : null}
          </dl>
        </div>
      </Container>
    </section>
  );
}