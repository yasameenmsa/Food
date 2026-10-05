import { Container } from "@/components/atoms/Layout";

/**
 * Menu skeleton.
 *
 * The tiles are a fixed `aspect-[4/3]` so the grid occupies exactly the space the
 * real cards will take. A skeleton that resizes on load is worse than no
 * skeleton: it produces the layout shift the performance budget is meant to
 * prevent.
 */
function Tile() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-brand">
      <div className="aspect-[4/3] w-full animate-pulse bg-stone/50" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-stone/50" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-stone/40" />
      </div>
    </div>
  );
}

export default function MenuLoading() {
  return (
    <Container className="py-8 md:py-12">
      <div className="h-8 w-32 animate-pulse rounded bg-stone/50" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <Tile key={i} />
        ))}
      </div>
      <p className="sr-only" role="status">
        جارٍ تحميل القائمة…
      </p>
    </Container>
  );
}
