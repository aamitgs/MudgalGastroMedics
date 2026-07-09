import { z } from "zod";

// Realistic hospital document types (ID proofs, insurance cards, scanned
// reports); anything else is rejected rather than accepted and mis-handled.
export const allowedDocumentMimeTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;

export const maxDocumentSizeBytes = 10 * 1024 * 1024;

export const documentEntityTypes = ["patient", "external-referral"] as const;

export const documentUploadFieldsSchema = z.object({
  entityType: z.enum(documentEntityTypes, { error: "Invalid entity type." }),
  entityId: z.string().trim().min(1, "Entity id is required."),
  groupId: z.string().trim().min(1).optional()
});

export const documentListQuerySchema = z.object({
  entityType: z.enum(documentEntityTypes, { error: "Invalid entity type." }),
  entityId: z.string().trim().min(1, "Entity id is required.")
});

export const documentVersionsQuerySchema = z.object({
  groupId: z.string().trim().min(1, "Group id is required.")
});

export const documentDownloadQuerySchema = z.object({
  id: z.string().trim().min(1, "Document id is required.")
});
