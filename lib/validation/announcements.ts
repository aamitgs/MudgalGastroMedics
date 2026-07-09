import { z } from "zod";

export const announcementCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120, "Keep the title under 120 characters."),
  detail: z.string().trim().min(1, "Message is required.").max(600, "Keep the message under 600 characters."),
  priority: z.enum(["Normal", "High", "Critical"]).default("Normal")
});

export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>;
