export type InventoryCategory = "Medicine" | "Consumable" | "Procedure Kit" | "Equipment";

export type InventoryItem = {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  reorderLevel: number;
  unit: string;
  vendor?: string;
  lastUpdatedAt: string;
};

export const inventoryCategories: InventoryCategory[] = ["Medicine", "Consumable", "Procedure Kit", "Equipment"];
