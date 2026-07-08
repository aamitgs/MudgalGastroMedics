import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
};

/**
 * Shared staff-form field wrapper (Track 3.2) — label + slot + inline error,
 * on site tokens. Distinct from HospitalOperatingSystem.tsx's private
 * FormField, which uses --hos-* OS-shell tokens; that one stays untouched.
 */
export function FormField({ label, htmlFor, error, hint, required, children }: FormFieldProps) {
  return (
    <div className="grid gap-1 text-sm">
      <label htmlFor={htmlFor} className="font-semibold text-ink">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-semibold text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
