import { Container } from "@/components/atoms/Layout";
import { Icon } from "@/components/atoms/Icon";
import type { AnnouncementDTO } from "@/types";

/**
 * Scrolling strip above the nav. `aria-live` is deliberately off: it is
 * decorative repetition of information already in the page body.
 */
export function AnnouncementBar({ announcements }: { announcements: AnnouncementDTO[] }) {
  if (announcements.length === 0) return null;

  const [first, ...rest] = announcements;

  return (
    <div className="bg-brand text-brand-foreground">
      <Container className="flex items-center gap-3 py-2">
        <Icon name="info" size={16} className="shrink-0" />
        <p className="truncate text-sm font-semibold">
          {first.body}
          {rest.length > 0 ? (
            <span className="ms-2 opacity-75">· {rest.map((item) => item.body).join(" · ")}</span>
          ) : null}
        </p>
      </Container>
    </div>
  );
}