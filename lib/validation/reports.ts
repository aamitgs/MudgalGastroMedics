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
