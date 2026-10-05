export type SpinnerProps = {
  className?: string;
  /** Announced to screen readers when the spinner is the only feedback. */
  label?: string;
};

export function Spinner({ className = "size-5", label }: SpinnerProps) {
  return (
    <span role={label ? "status" : undefined} className="inline-flex">
      <svg
        className={`animate-spin ${className}`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden={label ? undefined : true}
      >
        {label ? <title>{label}</title> : null}
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}