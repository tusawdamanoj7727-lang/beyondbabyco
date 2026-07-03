/**
 * Client-safe constants, types and helpers for the inventory module.
 */

export const STOCK_STATUSES = ["all", "in_stock", "low_stock", "out_of_stock", "incoming"] as const;
export type StockStatusFilter = (typeof STOCK_STATUSES)[number];

export const STOCK_STATUS_LABELS: Record<Exclude<StockStatusFilter, "all">, string> = {
  in_stock: "In Stock",
  low_stock: "Low Stock",
  out_of_stock: "Out Of Stock",
  incoming: "Incoming",
};

export type StockDisplayStatus = Exclude<StockStatusFilter, "all">;

export function computeStockStatus(
  available: number,
  reorderLevel: number,
  incoming: number,
): StockDisplayStatus {
  if (incoming > 0 && available <= 0) return "incoming";
  if (available <= 0) return "out_of_stock";
  if (available <= reorderLevel) return "low_stock";
  return "in_stock";
}

export const WAREHOUSE_STATUSES = ["active", "inactive"] as const;
export type WarehouseStatus = (typeof WAREHOUSE_STATUSES)[number];

export const PO_STATUSES = ["draft", "sent", "received", "cancelled"] as const;
export type PoStatus = (typeof PO_STATUSES)[number];

export const PO_STATUS_LABELS: Record<PoStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  received: "Received",
  cancelled: "Cancelled",
};

export const MOVEMENT_TYPES = [
  "adjustment",
  "purchase",
  "sale",
  "return",
  "transfer",
  "in",
  "out",
] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  adjustment: "Adjustment",
  purchase: "Purchase",
  sale: "Sale",
  return: "Return",
  transfer: "Transfer",
  in: "Stock In",
  out: "Stock Out",
};

export const ADJUSTMENT_REASONS = [
  "Cycle count",
  "Damaged goods",
  "Found stock",
  "Shrinkage",
  "Correction",
  "Other",
] as const;
export type AdjustmentReason = (typeof ADJUSTMENT_REASONS)[number];

export const INVENTORY_SORTABLE_COLUMNS = [
  "product",
  "variant",
  "warehouse",
  "quantity",
  "updated_at",
] as const;
export type InventorySortColumn = (typeof INVENTORY_SORTABLE_COLUMNS)[number];

export interface InventoryListItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  sku: string | null;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  available: number;
  reserved: number;
  incoming: number;
  reorderLevel: number;
  status: StockDisplayStatus;
  updatedAt: string;
}

export interface StockMovementItem {
  id: string;
  inventoryId: string;
  type: MovementType;
  quantity: number;
  reference: string | null;
  reason: string | null;
  note: string | null;
  productName: string;
  variantName: string;
  warehouseName: string;
  userName: string | null;
  createdAt: string;
}

export interface PurchaseOrderListItem {
  id: string;
  poNumber: string;
  supplierName: string | null;
  warehouseName: string | null;
  status: PoStatus;
  total: number;
  itemCount: number;
  expectedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
}

export interface InventoryDashboard {
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  incomingShipments: number;
  recentAdjustments: StockMovementItem[];
}
