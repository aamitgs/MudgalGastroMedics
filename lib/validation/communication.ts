import { z } from "zod";
import { communicationChannels, communicationStatuses, communicationTemplateKeys } from "@/lib/communication-types";

// message stays outside this schema entirely — it's a layered override
// (typed customMessage wins, otherwise the selected template's own message
// shows through reactively), computed at submit time from local component
// state, not a single registered field. See components/communication/AdminCommunication.tsx.
export const communicationLogCreateSchema = z
  .object({
    patientId: z.string().trim().optional(),
    patientName: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    channel: z.enum(communicationChannels, { error: "Invalid channel." }),
    template: z.enum(communicationTemplateKeys, { error: "Invalid template." }),
    status: z.enum(communicationStatuses, { error: "Invalid status." }),
    scheduledFor: z.string().trim().optional(),
    owner: z.string().trim().optional(),
    subject: z.string().trim().optional(),
    notes: z.string().trim().optional()
  })
  .superRefine((data, ctx) => {
    // Matches the original required={!selectedRecipient} — patientName/phone
    // are only mandatory for a manual (no-recipient-selected) entry.
    if (data.patientId) return;
    if (!data.patientName) ctx.addIssue({ code: "custom", message: "Patient name is required when no patient is selected.", path: ["patientName"] });
    if (!data.phone) ctx.addIssue({ code: "custom", message: "Phone is required when no patient is selected.", path: ["phone"] });
  });

export type CommunicationLogCreateInput = z.infer<typeof communicationLogCreateSchema>;
