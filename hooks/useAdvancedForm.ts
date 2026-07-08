"use client";

import { useForm } from "react-hook-form";
import type { FieldErrors, FieldValues, Resolver, UseFormProps } from "react-hook-form";
import type { ZodType } from "zod";

/**
 * Adapts a Zod schema into an RHF Resolver by hand — @hookform/resolvers is
 * not an installed dependency (28-package budget, Track "minimal deps"), and
 * this reduce-issues-to-a-field-map shape mirrors the applyIssues() helper
 * already established in HospitalOperatingSystem.tsx's ad hoc RHF forms, just
 * wired into RHF's real `resolver` option so errors surface inline (onBlur)
 * instead of only after a manual safeParse() in onSubmit.
 */
function zodResolver<TFieldValues extends FieldValues>(schema: ZodType<TFieldValues>): Resolver<TFieldValues> {
  return (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }
    const errors = result.error.issues.reduce<Record<string, { type: string; message: string }>>((acc, issue) => {
      const path = issue.path.join(".");
      if (path && !acc[path]) acc[path] = { type: "validation", message: issue.message };
      return acc;
    }, {});
    return { values: {}, errors: errors as FieldErrors<TFieldValues> };
  };
}

type UseAdvancedFormOptions<T extends FieldValues> = {
  schema: ZodType<T>;
  defaultValues?: UseFormProps<T>["defaultValues"];
  /** Runs only once the schema validates; return value is ignored. */
  onValid: (values: T) => Promise<void> | void;
};

/**
 * Shared form primitive (Track 3.2): RHF + Zod with true inline, on-blur
 * validation and no new dependency. Wraps a single schema for both the field
 * bindings and the submit-time payload — one source of truth per form, same
 * schema a REST route already validates against server-side where reused.
 */
export function useAdvancedForm<T extends FieldValues>({ schema, defaultValues, onValid }: UseAdvancedFormOptions<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues
  });

  const submit = form.handleSubmit(async (values) => {
    await onValid(values);
  });

  return { ...form, submit };
}
