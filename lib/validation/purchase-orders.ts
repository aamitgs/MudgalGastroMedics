import { z } from "zod";
import { purchaseOrderStatuses } from "@/lib/purchase-order-types";

const optionalText = z.string().trim().optional();

export const purchaseOrderCreateSchema = z.object({
  vendor: z.string().trim().min(1, "Vendor is required."),
  notes: optionalText,
  expectedDeliveryDate: optionalText,
  items: z
    .array(
      z.object({
        inventoryItemId: z.string().trim().min(1, "Inventory item is required."),
        quantityOrdered: z.coerce.number().positive("Quantity must be greater than zero."),
        unitCost: z.coerce.number().nonnegative().optional()
      })
    )
    .min(1, "Add at least one item to the order.")
});

export const purchaseOrderUpdateSchema = z.object({
  id: z.string().trim().min(1, "Purchase order id is required."),
  status: z.enum(purchaseOrderStatuses as [string, ...string[]], { error: "Invalid purchase order status." })
});

export const purchaseOrderDeleteSchema = z.object({
  id: z.string().trim().min(1, "Purchase order id is required.")
});

export type PurchaseOrderCreateInput = z.infer<typeof purchaseOrderCreateSchema>;
export type PurchaseOrderUpdateInput = z.infer<typeof purchaseOrderUpdateSchema>;
