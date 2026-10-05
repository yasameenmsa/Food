import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

/** Shared field chrome so every input in the site lines up exactly. */
const FIELD =
  "w-full rounded-card border-2 border-line bg-surface px-4 py-3 text-base text-foreground " +
  "placeholder:text-muted/70 transition-colors " +
  "focus:border-brand disabled:cursor-not-allowed disabled:opacity-60";

const INVALID = "border-danger focus:border-danger";

function describedBy(
  id: string,
  error?: string,
  hint?: string,
): string | undefined {
  const ids = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, id, className = "", ...rest }: InputProps) {
  const inputId = id ?? rest.name;
  return (
    <>
      {label ? (
        <label htmlFor={inputId} className="mb-1.5 block font-semibold">
          {label}
        </label>
      ) : null}
      <input
        {...rest}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId!, error, hint)}
        className={`${FIELD} ${error ? INVALID : ""} ${className}`}
      />
      {hint && !error ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </>
  );
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Textarea({
  label,
  error,
  hint,
  id,
  className = "",
  rows = 4,
  ...rest
}: TextareaProps) {
  const fieldId = id ?? rest.name;
  return (
    <>
      {label ? (
        <label htmlFor={fieldId} className="mb-1.5 block font-semibold">
          {label}
        </label>
      ) : null}
      <textarea
        {...rest}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId!, error, hint)}
        className={`${FIELD} ${error ? INVALID : ""} ${className}`}
      />
      {hint && !error ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${fieldId}-error`} className="mt-1.5 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </>
  );
}

export type SelectOption = { value: string; label: string };

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
};

export function Select({
  label,
  error,
  hint,
  options,
  placeholder,
  id,
  className = "",
  ...rest
}: SelectProps) {
  const fieldId = id ?? rest.name;
  return (
    <>
      {label ? (
        <label htmlFor={fieldId} className="mb-1.5 block font-semibold">
          {label}
        </label>
      ) : null}
      <select
        {...rest}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId!, error, hint)}
        className={`${FIELD} ${error ? INVALID : ""} ${className}`}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && !error ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${fieldId}-error`} className="mt-1.5 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </>
  );
}

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function Checkbox({ label, id, className = "", ...rest }: CheckboxProps) {
  const boxId = id ?? rest.name;
  return (
    <label
      htmlFor={boxId}
      className="flex cursor-pointer items-center gap-2.5 font-semibold"
    >
      <input
        {...rest}
        id={boxId}
        type="checkbox"
        className={`size-5 shrink-0 cursor-pointer accent-brand ${className}`}
      />
      <span>{label}</span>
    </label>
  );
}