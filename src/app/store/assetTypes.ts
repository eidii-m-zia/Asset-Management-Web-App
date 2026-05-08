export type AssetCondition = "excellent" | "good" | "fair" | "poor";
export type AssetStatus = "available" | "in-use" | "maintenance" | "retired";

export interface Asset {
  id: string;
  name: string;
  photo?: string;
  category: string;
  serialNumber: string;
  assignedTo: string;
  condition: AssetCondition;
  purchaseDate: string;
  purchasePrice: number;
  location: string;
  notes: string;
  inventoryId: string;
  status: AssetStatus;
  createdAt: string;
  tags: string[];
}

export interface Inventory {
  id: string;
  name: string;
  event: string;
  description: string;
  date: string;
  color: string;
  createdAt: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  description: string;
  totalQuantity: number;
  unit: string;
  notes: string;
  photo?: string;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface StockItemHistoryEntry {
  id: string;
  stockItemId: string;
  action: "created" | "updated";
  changedAt: string;
  changedBy: string;
  summary: string;
}

export interface InventoryStockEntry {
  id: string;
  inventoryId: string;
  stockItemId: string;
  quantityBrought: number;
  notes: string;
  createdAt: string;
}

export const INVENTORY_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
];
