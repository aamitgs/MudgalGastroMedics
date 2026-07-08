import type { z } from "zod";

/**
 * REST routes return `{ ok: false, error: string }` (frozen API shape), unlike
 * the server actions in app/mudgalgastromedics-os/actions.ts which return a
 * field-keyed `fieldErrors` record — so route call sites just need the single
 * most relevant message, not the full issue list.
 */
export function firstZodIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message || "Invalid request.";
}
