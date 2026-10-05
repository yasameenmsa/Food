import type { ReactNode } from "react";

export type FormFieldProps = {
  /** Ties the control to its label, error and hint. */
  htmlFor: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
};

/**
 * Label/error scaffolding for controls that are not plain inputs — radio groups,
 * quantity steppers, anything custom. Plain inputs already carry their own
 * label and error, so they do not need this.
 */
export function FormField({
  htmlFor,
  label,
  required = false,
  error,
  hint,
  children,
}: FormFieldProps) {
  const describedBy = [
    error ? `${htmlFor}-error` : null,
    hint ? `${htmlFor}-hint` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <fieldset aria-describedby={describedBy || undefined} className="min-w-0">
      <legend className="mb-1.5 font-semibold">
        {label}
        {required ? (
          <span aria-hidden className="ms-1 text-danger">
            *
          </span>
        ) : null}
      </legend>
      {children}
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Form-level problem, shown once at the top rather than per field. */
export function FormAlert({
  tone = "danger",
  children,
}: {
  tone?: "danger" | "success" | "info";
  children: ReactNode;
}) {
  const tones = {
    danger: "border-danger/40 bg-danger/10 text-danger",
    success: "border-success/40 bg-success/10 text-success",
    info: "border-brand/30 bg-brand/10 text-brand",
  } as const;

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`rounded-card border-2 px-4 py-3 font-semibold ${tones[tone]}`}
    >
      {children}
    </div>
  );
}