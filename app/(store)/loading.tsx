/** Generic storefront fallback. Pages with a shaped skeleton provide their own. */
export default function StoreLoading() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-12">
      <div className="h-8 w-48 animate-pulse rounded bg-stone/50" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-20 w-full animate-pulse rounded-lg bg-stone/40" />
        ))}
      </div>
      <p className="sr-only" role="status">
        جارٍ التحميل…
      </p>
    </div>
  );
}
