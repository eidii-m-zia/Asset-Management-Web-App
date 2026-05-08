import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createAssetRecord,
  createInventoryRecord,
  createInventoryStockEntryRecord,
  createStockItemRecord,
  deleteAssetRecord,
  deleteInventoryRecord,
  deleteInventoryStockEntryRecord,
  deleteStockItemRecord,
  fetchAssetSnapshot,
  updateAssetRecord,
  updateInventoryRecord,
  updateInventoryStockEntryRecord,
  updateStockItemRecord,
} from "@/utils/supabase/assetData";
import { INVENTORY_COLORS } from "./assetTypes";
import type {
  Asset,
  Inventory,
  InventoryStockEntry,
  StockItem,
  StockItemHistoryEntry,
} from "./assetTypes";

export type {
  Asset,
  AssetCondition,
  AssetStatus,
  Inventory,
  InventoryStockEntry,
  StockItem,
  StockItemHistoryEntry,
} from "./assetTypes";
export { INVENTORY_COLORS } from "./assetTypes";

interface AssetContextType {
  assets: Asset[];
  inventories: Inventory[];
  stockItems: StockItem[];
  stockItemHistory: StockItemHistoryEntry[];
  inventoryStockEntries: InventoryStockEntry[];
  isLoading: boolean;
  error: string | null;
  reloadData: () => Promise<void>;
  addAsset: (asset: Omit<Asset, "id" | "createdAt">) => Promise<void>;
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  addInventory: (inventory: Omit<Inventory, "id" | "createdAt">) => Promise<void>;
  updateInventory: (id: string, updates: Partial<Inventory>) => Promise<void>;
  deleteInventory: (id: string) => Promise<void>;
  getInventoryAssets: (inventoryId: string) => Asset[];
  addStockItem: (
    item: Omit<StockItem, "id" | "createdAt" | "updatedAt" | "updatedBy">,
    updatedBy?: string
  ) => Promise<void>;
  updateStockItem: (
    id: string,
    updates: Partial<StockItem>,
    updatedBy?: string
  ) => Promise<void>;
  deleteStockItem: (id: string) => Promise<void>;
  addInventoryStockEntry: (
    entry: Omit<InventoryStockEntry, "id" | "createdAt">
  ) => Promise<void>;
  updateInventoryStockEntry: (
    id: string,
    updates: Partial<InventoryStockEntry>
  ) => Promise<void>;
  deleteInventoryStockEntry: (id: string) => Promise<void>;
  getInventoryStockEntries: (inventoryId: string) => InventoryStockEntry[];
  getStockItemAllocated: (stockItemId: string) => number;
  getStockItemAvailable: (stockItemId: string) => number;
  getStockItemHistory: (stockItemId: string) => StockItemHistoryEntry[];
  INVENTORY_COLORS: string[];
}

const AssetContext = createContext<AssetContextType | null>(null);

export function AssetProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockItemHistory, setStockItemHistory] = useState<StockItemHistoryEntry[]>([]);
  const [inventoryStockEntries, setInventoryStockEntries] = useState<InventoryStockEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applySnapshot = useCallback(
    (snapshot: {
      assets: Asset[];
      inventories: Inventory[];
      stockItems: StockItem[];
      stockItemHistory: StockItemHistoryEntry[];
      inventoryStockEntries: InventoryStockEntry[];
    }) => {
      setAssets(snapshot.assets);
      setInventories(snapshot.inventories);
      setStockItems(snapshot.stockItems);
      setStockItemHistory(snapshot.stockItemHistory);
      setInventoryStockEntries(snapshot.inventoryStockEntries);
    },
    []
  );

  const reloadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const snapshot = await fetchAssetSnapshot();
      applySnapshot(snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data from Supabase.");
    } finally {
      setIsLoading(false);
    }
  }, [applySnapshot]);

  useEffect(() => {
    void reloadData();
  }, [reloadData]);

  const getInventoryAssets = useCallback(
    (inventoryId: string) => assets.filter((asset) => asset.inventoryId === inventoryId),
    [assets]
  );

  const getInventoryStockEntries = useCallback(
    (inventoryId: string) =>
      inventoryStockEntries.filter((entry) => entry.inventoryId === inventoryId),
    [inventoryStockEntries]
  );

  const getStockItemAllocated = useCallback(
    (stockItemId: string) =>
      inventoryStockEntries
        .filter((entry) => entry.stockItemId === stockItemId)
        .reduce((sum, entry) => sum + entry.quantityBrought, 0),
    [inventoryStockEntries]
  );

  const getStockItemAvailable = useCallback(
    (stockItemId: string) => {
      const item = stockItems.find((stockItem) => stockItem.id === stockItemId);
      if (!item) return 0;
      return item.totalQuantity - getStockItemAllocated(stockItemId);
    },
    [getStockItemAllocated, stockItems]
  );

  const getStockItemHistory = useCallback(
    (stockItemId: string) =>
      stockItemHistory
        .filter((entry) => entry.stockItemId === stockItemId)
        .sort(
          (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
        ),
    [stockItemHistory]
  );

  const value = useMemo<AssetContextType>(
    () => ({
      assets,
      inventories,
      stockItems,
      stockItemHistory,
      inventoryStockEntries,
      isLoading,
      error,
      reloadData,
      addAsset: async (assetInput) => {
        setError(null);
        const created = await createAssetRecord(assetInput);
        setAssets((prev) => [created, ...prev]);
      },
      updateAsset: async (id, updates) => {
        setError(null);
        const updated = await updateAssetRecord(id, updates);
        setAssets((prev) => prev.map((asset) => (asset.id === id ? updated : asset)));
      },
      deleteAsset: async (id) => {
        setError(null);
        await deleteAssetRecord(id);
        setAssets((prev) => prev.filter((asset) => asset.id !== id));
      },
      addInventory: async (inventoryInput) => {
        setError(null);
        const created = await createInventoryRecord(inventoryInput);
        setInventories((prev) => [created, ...prev]);
      },
      updateInventory: async (id, updates) => {
        setError(null);
        const updated = await updateInventoryRecord(id, updates);
        setInventories((prev) =>
          prev.map((inventory) => (inventory.id === id ? updated : inventory))
        );
      },
      deleteInventory: async (id) => {
        setError(null);
        await deleteInventoryRecord(id);
        setInventories((prev) => prev.filter((inventory) => inventory.id !== id));
        setAssets((prev) => prev.filter((asset) => asset.inventoryId !== id));
        setInventoryStockEntries((prev) =>
          prev.filter((entry) => entry.inventoryId !== id)
        );
      },
      getInventoryAssets,
      addStockItem: async (itemInput, updatedBy) => {
        setError(null);
        const created = await createStockItemRecord(itemInput, updatedBy);
        setStockItems((prev) => [created, ...prev]);
        setStockItemHistory((prev) => [
          {
            id: `hist-${created.id}-created-runtime`,
            stockItemId: created.id,
            action: "created",
            changedAt: created.updatedAt || created.createdAt,
            changedBy: created.updatedBy || updatedBy || "Unknown user",
            summary: `Created with ${created.totalQuantity} ${created.unit}`,
          },
          ...prev,
        ]);
        await reloadData();
      },
      updateStockItem: async (id, updates, updatedBy) => {
        setError(null);
        const updated = await updateStockItemRecord(id, updates, updatedBy);
        setStockItems((prev) =>
          prev.map((stockItem) => (stockItem.id === id ? updated : stockItem))
        );
        await reloadData();
      },
      deleteStockItem: async (id) => {
        setError(null);
        await deleteStockItemRecord(id);
        setStockItems((prev) => prev.filter((stockItem) => stockItem.id !== id));
        setInventoryStockEntries((prev) =>
          prev.filter((entry) => entry.stockItemId !== id)
        );
        setStockItemHistory((prev) =>
          prev.filter((entry) => entry.stockItemId !== id)
        );
      },
      addInventoryStockEntry: async (entryInput) => {
        setError(null);
        const created = await createInventoryStockEntryRecord(entryInput);
        setInventoryStockEntries((prev) => [created, ...prev]);
      },
      updateInventoryStockEntry: async (id, updates) => {
        setError(null);
        const updated = await updateInventoryStockEntryRecord(id, updates);
        setInventoryStockEntries((prev) =>
          prev.map((entry) => (entry.id === id ? updated : entry))
        );
      },
      deleteInventoryStockEntry: async (id) => {
        setError(null);
        await deleteInventoryStockEntryRecord(id);
        setInventoryStockEntries((prev) => prev.filter((entry) => entry.id !== id));
      },
      getInventoryStockEntries,
      getStockItemAllocated,
      getStockItemAvailable,
      getStockItemHistory,
      INVENTORY_COLORS,
    }),
    [
      assets,
      error,
      getInventoryAssets,
      getInventoryStockEntries,
      getStockItemAllocated,
      getStockItemAvailable,
      getStockItemHistory,
      inventories,
      inventoryStockEntries,
      isLoading,
      reloadData,
      stockItemHistory,
      stockItems,
    ]
  );

  return <AssetContext.Provider value={value}>{children}</AssetContext.Provider>;
}

export function useAssets() {
  const ctx = useContext(AssetContext);
  if (!ctx) throw new Error("useAssets must be used within AssetProvider");
  return ctx;
}
