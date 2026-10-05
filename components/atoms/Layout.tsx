/** Thin olive rule, standing in for the brand's olive-branch divider. */
export function Divider({ className = "" }: { className?: string }) {
  return <hr className={`olive-rule my-8 ${className}`} />;
}

/** Page-width container. 1200px max, per brand-style.md. */
export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-[1200px] px-4 ${className}`}>{children}</div>;
}

/** Vertical rhythm between sections: 48px on mobile, 80px on desktop. */
export function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-12 md:py-20 ${className}`}>
      {children}
    </section>
  );
}