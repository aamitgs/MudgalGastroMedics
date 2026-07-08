import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

/** Groups related fields under a labeled fieldset (Track 3.2) — scannability for longer forms. */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <fieldset className="grid gap-3 rounded border border-line/70 bg-surface/60 p-3">
      <legend className="px-1 text-xs font-black uppercase tracking-[0.12em] text-brand">{title}</legend>
      {description ? <p className="-mt-1 text-xs text-muted">{description}</p> : null}
      {children}
    </fieldset>
  );
}
