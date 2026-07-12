import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

type HosFormFieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

/**
 * Hospital OS shell's form field wrapper — label + slot + inline error, on
 * --hos-* OS-shell tokens. Distinct from components/design-system/FormField.tsx,
 * which is the staff-form (site-token) equivalent; that one stays untouched.
 */
export function HosFormField({ label, error, children }: HosFormFieldProps) {
  return (
    <div className="grid gap-2">
      <Label className="text-xs font-semibold text-[var(--hos-muted-text)]">{label}</Label>
      {children}
      {error ? <p className="text-xs font-semibold text-[var(--hos-danger)]">{error}</p> : null}
    </div>
  );
}
