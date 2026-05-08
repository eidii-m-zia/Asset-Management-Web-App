import { createClient } from "./client";
import {
  defaultAssets,
  defaultInventories,
  defaultInventoryStockEntries,
  defaultStockItemHistory,
  defaultStockItems,
} from "@/app/store/assetSeeds";
import type {
  Asset,
  Inventory,
  InventoryStockEntry,
  StockItem,
  StockItemHistoryEntry,
} from "@/app/store/assetTypes";

const SETUP_HINT =
  "Supabase tables are not set up yet. Run the SQL in supabase/migrations/20260508120000_init_asset_management.sql, then reload the app.";

type InventoryRow = {
  id: string;
  name: string;
  event: string | null;
  description: string | null;
  date: string | null;
  color: string;
  created_at: string;
};

type AssetRow = {
  id: string;
  name: string;
  photo: string | null;
  category: string;
  serial_number: string | null;
  assigned_to: string | null;
  condition: Asset["condition"];
  purchase_date: string | null;
  purchase_price: number | null;
  location: string | null;
  notes: string | null;
  inventory_id: string;
  status: Asset["status"];
  created_at: string;
  tags: string[] | null;
};

type StockItemRow = {
  id: string;
  name: string;
  category: string | null;
  sku: string | null;
  description: string | null;
  total_quantity: number;
  unit: string;
  notes: string | null;
  photo: string | null;
  created_at: string;
  updated_at: string | null;
  updated_by: string | null;
};

type StockItemHistoryRow = {
  id: string;
  stock_item_id: string;
  action: StockItemHistoryEntry["action"];
  changed_at: string;
  changed_by: string;
  summary: string;
};

type InventoryStockEntryRow = {
  id: string;
  inventory_id: string;
  stock_item_id: string;
  quantity_brought: number;
  notes: string | null;
  created_at: string;
};

export interface AssetDataSnapshot {
  assets: Asset[];
  inventories: Inventory[];
  stockItems: StockItem[];
  stockItemHistory: StockItemHistoryEntry[];
  inventoryStockEntries: InventoryStockEntry[];
}

const INVENTORY_SELECT = "id, name, event, description, date, color, created_at";
const ASSET_SELECT =
  "id, name, photo, category, serial_number, assigned_to, condition, purchase_date, purchase_price, location, notes, inventory_id, status, created_at, tags";
const STOCK_ITEM_SELECT =
  "id, name, category, sku, description, total_quantity, unit, notes, photo, created_at, updated_at, updated_by";
const STOCK_ITEM_HISTORY_SELECT =
  "id, stock_item_id, action, changed_at, changed_by, summary";
const INVENTORY_STOCK_ENTRY_SELECT =
  "id, inventory_id, stock_item_id, quantity_brought, notes, created_at";

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
    const message = "message" in error ? String(error.message) : "Unknown Supabase error";
    const code = "code" in error && error.code ? ` (${String(error.code)})` : "";
    const combined = `${message}${code}`;

    if (combined.includes("relation") && combined.includes("does not exist")) {
      return `${combined}. ${SETUP_HINT}`;
    }

    if (combined.includes("permission denied") || combined.includes("JWT")) {
      return `${combined}. Check your Supabase project policies and MCP authentication.`;
    }

    return combined;
  }

  return "Unknown Supabase error";
}

function ensure<T>(value: T, fallback: T): T {
  return value ?? fallback;
}

function mapInventory(row: InventoryRow): Inventory {
  return {
    id: row.id,
    name: row.name,
    event: row.event ?? "",
    description: row.description ?? "",
    date: row.date ?? "",
    color: row.color,
    createdAt: row.created_at,
  };
}

function mapAsset(row: AssetRow): Asset {
  return {
    id: row.id,
    name: row.name,
    photo: row.photo ?? "",
    category: row.category,
    serialNumber: row.serial_number ?? "",
    assignedTo: row.assigned_to ?? "",
    condition: row.condition,
    purchaseDate: row.purchase_date ?? "",
    purchasePrice: row.purchase_price ?? 0,
    location: row.location ?? "",
    notes: row.notes ?? "",
    inventoryId: row.inventory_id,
    status: row.status,
    createdAt: row.created_at,
    tags: row.tags ?? [],
  };
}

function mapStockItem(row: StockItemRow): StockItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? "",
    sku: row.sku ?? "",
    description: row.description ?? "",
    totalQuantity: row.total_quantity,
    unit: row.unit,
    notes: row.notes ?? "",
    photo: row.photo ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    updatedBy: row.updated_by ?? "",
  };
}

function mapStockItemHistory(row: StockItemHistoryRow): StockItemHistoryEntry {
  return {
    id: row.id,
    stockItemId: row.stock_item_id,
    action: row.action,
    changedAt: row.changed_at,
    changedBy: row.changed_by,
    summary: row.summary,
  };
}

function mapInventoryStockEntry(row: InventoryStockEntryRow): InventoryStockEntry {
  return {
    id: row.id,
    inventoryId: row.inventory_id,
    stockItemId: row.stock_item_id,
    quantityBrought: row.quantity_brought,
    notes: row.notes ?? "",
    createdAt: row.created_at,
  };
}

function toInventoryRow(input: Inventory): InventoryRow {
  return {
    id: input.id,
    name: input.name,
    event: input.event || null,
    description: input.description || null,
    date: input.date || null,
    color: input.color,
    created_at: input.createdAt,
  };
}

function toAssetRow(input: Asset): AssetRow {
  return {
    id: input.id,
    name: input.name,
    photo: input.photo || null,
    category: input.category,
    serial_number: input.serialNumber || null,
    assigned_to: input.assignedTo || null,
    condition: input.condition,
    purchase_date: input.purchaseDate || null,
    purchase_price: input.purchasePrice || 0,
    location: input.location || null,
    notes: input.notes || null,
    inventory_id: input.inventoryId,
    status: input.status,
    created_at: input.createdAt,
    tags: input.tags,
  };
}

function toStockItemRow(input: StockItem): StockItemRow {
  return {
    id: input.id,
    name: input.name,
    category: input.category || null,
    sku: input.sku || null,
    description: input.description || null,
    total_quantity: input.totalQuantity,
    unit: input.unit,
    notes: input.notes || null,
    photo: input.photo || null,
    created_at: input.createdAt,
    updated_at: input.updatedAt || input.createdAt,
    updated_by: input.updatedBy || null,
  };
}

function toStockItemHistoryRow(input: StockItemHistoryEntry): StockItemHistoryRow {
  return {
    id: input.id,
    stock_item_id: input.stockItemId,
    action: input.action,
    changed_at: input.changedAt,
    changed_by: input.changedBy,
    summary: input.summary,
  };
}

function toInventoryStockEntryRow(input: InventoryStockEntry): InventoryStockEntryRow {
  return {
    id: input.id,
    inventory_id: input.inventoryId,
    stock_item_id: input.stockItemId,
    quantity_brought: input.quantityBrought,
    notes: input.notes || null,
    created_at: input.createdAt,
  };
}

function buildAssetUpdate(updates: Partial<Asset>) {
  const payload: Partial<AssetRow> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.photo !== undefined) payload.photo = updates.photo || null;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.serialNumber !== undefined) payload.serial_number = updates.serialNumber || null;
  if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo || null;
  if (updates.condition !== undefined) payload.condition = updates.condition;
  if (updates.purchaseDate !== undefined) payload.purchase_date = updates.purchaseDate || null;
  if (updates.purchasePrice !== undefined) payload.purchase_price = updates.purchasePrice;
  if (updates.location !== undefined) payload.location = updates.location || null;
  if (updates.notes !== undefined) payload.notes = updates.notes || null;
  if (updates.inventoryId !== undefined) payload.inventory_id = updates.inventoryId;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.tags !== undefined) payload.tags = updates.tags;
  return payload;
}

function buildInventoryUpdate(updates: Partial<Inventory>) {
  const payload: Partial<InventoryRow> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.event !== undefined) payload.event = updates.event || null;
  if (updates.description !== undefined) payload.description = updates.description || null;
  if (updates.date !== undefined) payload.date = updates.date || null;
  if (updates.color !== undefined) payload.color = updates.color;
  return payload;
}

function buildStockItemUpdate(updates: Partial<StockItem>, updatedBy?: string) {
  const payload: Partial<StockItemRow> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.category !== undefined) payload.category = updates.category || null;
  if (updates.sku !== undefined) payload.sku = updates.sku || null;
  if (updates.description !== undefined) payload.description = updates.description || null;
  if (updates.totalQuantity !== undefined) payload.total_quantity = updates.totalQuantity;
  if (updates.unit !== undefined) payload.unit = updates.unit;
  if (updates.notes !== undefined) payload.notes = updates.notes || null;
  if (updates.photo !== undefined) payload.photo = updates.photo || null;
  payload.updated_at = new Date().toISOString();
  payload.updated_by = updatedBy || updates.updatedBy || "Unknown user";
  return payload;
}

function buildInventoryStockEntryUpdate(updates: Partial<InventoryStockEntry>) {
  const payload: Partial<InventoryStockEntryRow> = {};
  if (updates.inventoryId !== undefined) payload.inventory_id = updates.inventoryId;
  if (updates.stockItemId !== undefined) payload.stock_item_id = updates.stockItemId;
  if (updates.quantityBrought !== undefined) payload.quantity_brought = updates.quantityBrought;
  if (updates.notes !== undefined) payload.notes = updates.notes || null;
  return payload;
}

function generateId(prefix: string) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readLegacyData<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function getBootstrapSnapshot(): AssetDataSnapshot {
  return {
    assets: readLegacyData("assets", defaultAssets),
    inventories: readLegacyData("inventories", defaultInventories),
    stockItems: readLegacyData("stockItems", defaultStockItems),
    stockItemHistory: readLegacyData("stockItemHistory", defaultStockItemHistory),
    inventoryStockEntries: readLegacyData(
      "inventoryStockEntries",
      defaultInventoryStockEntries
    ),
  };
}

function isEmptySnapshot(snapshot: AssetDataSnapshot) {
  return (
    snapshot.assets.length === 0 &&
    snapshot.inventories.length === 0 &&
    snapshot.stockItems.length === 0 &&
    snapshot.stockItemHistory.length === 0 &&
    snapshot.inventoryStockEntries.length === 0
  );
}

async function readSnapshot(): Promise<AssetDataSnapshot> {
  const supabase = createClient();

  const [
    inventoriesResult,
    assetsResult,
    stockItemsResult,
    stockItemHistoryResult,
    inventoryStockEntriesResult,
  ] = await Promise.all([
    supabase.from("inventories").select(INVENTORY_SELECT).order("created_at", { ascending: false }),
    supabase.from("assets").select(ASSET_SELECT).order("created_at", { ascending: false }),
    supabase.from("stock_items").select(STOCK_ITEM_SELECT).order("created_at", { ascending: false }),
    supabase
      .from("stock_item_history")
      .select(STOCK_ITEM_HISTORY_SELECT)
      .order("changed_at", { ascending: false }),
    supabase
      .from("inventory_stock_entries")
      .select(INVENTORY_STOCK_ENTRY_SELECT)
      .order("created_at", { ascending: false }),
  ]);

  const firstError =
    inventoriesResult.error ||
    assetsResult.error ||
    stockItemsResult.error ||
    stockItemHistoryResult.error ||
    inventoryStockEntriesResult.error;

  if (firstError) {
    throw new Error(getErrorMessage(firstError));
  }

  return {
    inventories: ensure(inventoriesResult.data, []).map((row) => mapInventory(row as InventoryRow)),
    assets: ensure(assetsResult.data, []).map((row) => mapAsset(row as AssetRow)),
    stockItems: ensure(stockItemsResult.data, []).map((row) => mapStockItem(row as StockItemRow)),
    stockItemHistory: ensure(stockItemHistoryResult.data, []).map((row) =>
      mapStockItemHistory(row as StockItemHistoryRow)
    ),
    inventoryStockEntries: ensure(inventoryStockEntriesResult.data, []).map((row) =>
      mapInventoryStockEntry(row as InventoryStockEntryRow)
    ),
  };
}

async function seedSnapshot(snapshot: AssetDataSnapshot) {
  const supabase = createClient();

  if (snapshot.inventories.length > 0) {
    const { error } = await supabase
      .from("inventories")
      .upsert(snapshot.inventories.map(toInventoryRow), { onConflict: "id" });
    if (error) throw new Error(getErrorMessage(error));
  }

  if (snapshot.stockItems.length > 0) {
    const { error } = await supabase
      .from("stock_items")
      .upsert(snapshot.stockItems.map(toStockItemRow), { onConflict: "id" });
    if (error) throw new Error(getErrorMessage(error));
  }

  if (snapshot.assets.length > 0) {
    const { error } = await supabase
      .from("assets")
      .upsert(snapshot.assets.map(toAssetRow), { onConflict: "id" });
    if (error) throw new Error(getErrorMessage(error));
  }

  if (snapshot.stockItemHistory.length > 0) {
    const { error } = await supabase
      .from("stock_item_history")
      .upsert(snapshot.stockItemHistory.map(toStockItemHistoryRow), { onConflict: "id" });
    if (error) throw new Error(getErrorMessage(error));
  }

  if (snapshot.inventoryStockEntries.length > 0) {
    const { error } = await supabase
      .from("inventory_stock_entries")
      .upsert(snapshot.inventoryStockEntries.map(toInventoryStockEntryRow), {
        onConflict: "id",
      });
    if (error) throw new Error(getErrorMessage(error));
  }
}

export async function fetchAssetSnapshot() {
  let snapshot = await readSnapshot();

  if (isEmptySnapshot(snapshot)) {
    await seedSnapshot(getBootstrapSnapshot());
    snapshot = await readSnapshot();
  }

  return snapshot;
}

export async function createAssetRecord(input: Omit<Asset, "id" | "createdAt">) {
  const supabase = createClient();
  const newAsset: Asset = {
    ...input,
    id: generateId("asset"),
    createdAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("assets")
    .insert(toAssetRow(newAsset))
    .select(ASSET_SELECT)
    .single();

  if (error) throw new Error(getErrorMessage(error));
  return mapAsset(data as AssetRow);
}

export async function updateAssetRecord(id: string, updates: Partial<Asset>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assets")
    .update(buildAssetUpdate(updates))
    .eq("id", id)
    .select(ASSET_SELECT)
    .single();

  if (error) throw new Error(getErrorMessage(error));
  return mapAsset(data as AssetRow);
}

export async function deleteAssetRecord(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("assets").delete().eq("id", id);
  if (error) throw new Error(getErrorMessage(error));
}

export async function createInventoryRecord(input: Omit<Inventory, "id" | "createdAt">) {
  const supabase = createClient();
  const inventory: Inventory = {
    ...input,
    id: generateId("inventory"),
    createdAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("inventories")
    .insert(toInventoryRow(inventory))
    .select(INVENTORY_SELECT)
    .single();

  if (error) throw new Error(getErrorMessage(error));
  return mapInventory(data as InventoryRow);
}

export async function updateInventoryRecord(id: string, updates: Partial<Inventory>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventories")
    .update(buildInventoryUpdate(updates))
    .eq("id", id)
    .select(INVENTORY_SELECT)
    .single();

  if (error) throw new Error(getErrorMessage(error));
  return mapInventory(data as InventoryRow);
}

export async function deleteInventoryRecord(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("inventories").delete().eq("id", id);
  if (error) throw new Error(getErrorMessage(error));
}

async function createStockHistoryRecord(entry: StockItemHistoryEntry) {
  const supabase = createClient();
  const { error } = await supabase
    .from("stock_item_history")
    .insert(toStockItemHistoryRow(entry));

  if (error) throw new Error(getErrorMessage(error));
}

export async function createStockItemRecord(
  input: Omit<StockItem, "id" | "createdAt" | "updatedAt" | "updatedBy">,
  updatedBy = "Unknown user"
) {
  const supabase = createClient();
  const timestamp = new Date().toISOString();
  const stockItem: StockItem = {
    ...input,
    id: generateId("stock"),
    createdAt: timestamp,
    updatedAt: timestamp,
    updatedBy,
  };

  const { data, error } = await supabase
    .from("stock_items")
    .insert(toStockItemRow(stockItem))
    .select(STOCK_ITEM_SELECT)
    .single();

  if (error) throw new Error(getErrorMessage(error));

  const created = mapStockItem(data as StockItemRow);
  await createStockHistoryRecord({
    id: generateId("history"),
    stockItemId: created.id,
    action: "created",
    changedAt: timestamp,
    changedBy: updatedBy,
    summary: `Created with ${created.totalQuantity} ${created.unit}`,
  });

  return created;
}

export async function updateStockItemRecord(
  id: string,
  updates: Partial<StockItem>,
  updatedBy = "Unknown user"
) {
  const supabase = createClient();
  const { data: currentData, error: currentError } = await supabase
    .from("stock_items")
    .select(STOCK_ITEM_SELECT)
    .eq("id", id)
    .single();

  if (currentError) throw new Error(getErrorMessage(currentError));

  const currentItem = mapStockItem(currentData as StockItemRow);
  const { data, error } = await supabase
    .from("stock_items")
    .update(buildStockItemUpdate(updates, updatedBy))
    .eq("id", id)
    .select(STOCK_ITEM_SELECT)
    .single();

  if (error) throw new Error(getErrorMessage(error));

  const updated = mapStockItem(data as StockItemRow);
  const changeParts: string[] = [];

  if (updates.name !== undefined && updates.name !== currentItem.name) {
    changeParts.push(`name: ${currentItem.name} -> ${updates.name}`);
  }
  if (
    updates.totalQuantity !== undefined &&
    updates.totalQuantity !== currentItem.totalQuantity
  ) {
    changeParts.push(`quantity: ${currentItem.totalQuantity} -> ${updates.totalQuantity}`);
  }
  if (updates.unit !== undefined && updates.unit !== currentItem.unit) {
    changeParts.push(`unit: ${currentItem.unit} -> ${updates.unit}`);
  }
  if (updates.category !== undefined && updates.category !== currentItem.category) {
    changeParts.push(`category: ${currentItem.category || "-"} -> ${updates.category || "-"}`);
  }
  if (updates.sku !== undefined && updates.sku !== currentItem.sku) {
    changeParts.push("SKU updated");
  }
  if (updates.notes !== undefined && updates.notes !== currentItem.notes) {
    changeParts.push("notes updated");
  }
  if (updates.description !== undefined && updates.description !== currentItem.description) {
    changeParts.push("description updated");
  }

  await createStockHistoryRecord({
    id: generateId("history"),
    stockItemId: id,
    action: "updated",
    changedAt: updated.updatedAt || new Date().toISOString(),
    changedBy: updatedBy,
    summary: changeParts.length > 0 ? changeParts.join(", ") : "Record updated",
  });

  return updated;
}

export async function deleteStockItemRecord(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("stock_items").delete().eq("id", id);
  if (error) throw new Error(getErrorMessage(error));
}

export async function createInventoryStockEntryRecord(
  input: Omit<InventoryStockEntry, "id" | "createdAt">
) {
  const supabase = createClient();
  const entry: InventoryStockEntry = {
    ...input,
    id: generateId("inventory-stock"),
    createdAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("inventory_stock_entries")
    .insert(toInventoryStockEntryRow(entry))
    .select(INVENTORY_STOCK_ENTRY_SELECT)
    .single();

  if (error) throw new Error(getErrorMessage(error));
  return mapInventoryStockEntry(data as InventoryStockEntryRow);
}

export async function updateInventoryStockEntryRecord(
  id: string,
  updates: Partial<InventoryStockEntry>
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_stock_entries")
    .update(buildInventoryStockEntryUpdate(updates))
    .eq("id", id)
    .select(INVENTORY_STOCK_ENTRY_SELECT)
    .single();

  if (error) throw new Error(getErrorMessage(error));
  return mapInventoryStockEntry(data as InventoryStockEntryRow);
}

export async function deleteInventoryStockEntryRecord(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("inventory_stock_entries")
    .delete()
    .eq("id", id);

  if (error) throw new Error(getErrorMessage(error));
}
