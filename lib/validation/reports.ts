import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Use YYYY-MM-DD." });

export const reportRangeQuerySchema = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional()
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    error: "'from' must not be after 'to'.",
    path: ["from"]
  });

const analyticsWindows = [7, 14, 30, 90] as const;

export const analyticsQuerySchema = z.object({
  days: z.coerce.number().refine((value) => (analyticsWindows as readonly number[]).includes(value), { error: "days must be 7, 14, 30, or 90." }).optional()
});

export const drilldownQuerySchema = z.object({
  metric: z.string().trim().min(1, "metric is required."),
  from: isoDate.optional(),
  to: isoDate.optional()
});

// Backs the generic "export current table view as PDF" route (Track 3.4).
// Bounded well above DataTable's fixed 25-row page size — a sanity ceiling
// against a malformed payload, not a real expected volume.
export const tableExportSchema = z.object({
  title: z.string({ error: "title is required." }).trim().min(1, "title is required.").max(120),
  headers: z.array(z.string()).min(1, "headers must include at least one column.").max(30),
  rows: z.array(z.array(z.string())).max(500, "Too many rows to export at once.")
});
