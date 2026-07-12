import { z } from "zod";
import { inventoryCategories } from "@/lib/inventory-types";

// The { error } option on the base z.string()/z.coerce.number() call (not
// just a chained .min() message) is what covers an entirely-absent key —
// .min() alone only fires once the type check already passed, so an absent
// required field would otherwise surface a raw "expected string, received
// undefined" instead of this friendly message (caught live on this exact
// field during verification).
export const inventoryItemCreateSchema = z.object({
  name: z.string({ error: "Item name is required." }).trim().min(1, "Item name is required."),
  category: z.enum(inventoryCategories, { error: "Invalid inventory category." }),
  quantity: z.coerce.number({ error: "Quantity is required." }).min(0, "Quantity must be zero or greater."),
  reorderLevel: z.coerce.number({ error: "Reorder level is required." }).min(0, "Reorder level must be zero or greater."),
  unit: z.string({ error: "Unit is required." }).trim().min(1, "Unit is required."),
  vendor: z.string().trim().optional(),
  batchNumber: z.string().trim().optional(),
  lotNumber: z.string().trim().optional(),
  expiryDate: z.string().trim().optional()
});

export type InventoryItemCreateInput = z.infer<typeof inventoryItemCreateSchema>;
