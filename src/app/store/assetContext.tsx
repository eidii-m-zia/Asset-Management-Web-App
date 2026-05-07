import React, { createContext, useContext, useState, useEffect } from "react";

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
}

export interface InventoryStockEntry {
  id: string;
  inventoryId: string;
  stockItemId: string;
  quantityBrought: number;
  notes: string;
  createdAt: string;
}

const INVENTORY_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#0ea5e9",
];

const defaultInventories: Inventory[] = [
  {
    id: "inv-1",
    name: "Summer Conference 2026",
    event: "Annual Tech Summit",
    description: "AV equipment and stage materials for the summer conference",
    date: "2026-07-15",
    color: "#6366f1",
    createdAt: "2026-01-10T09:00:00Z",
  },
  {
    id: "inv-2",
    name: "Product Launch Q2",
    event: "Product Launch Event",
    description: "Displays, lighting, and booth materials for the Q2 launch",
    date: "2026-05-20",
    color: "#ec4899",
    createdAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "inv-3",
    name: "Office General",
    event: "Permanent Assets",
    description: "All permanent office equipment and furniture",
    date: "",
    color: "#22c55e",
    createdAt: "2025-12-01T08:00:00Z",
  },
];

const defaultAssets: Asset[] = [
  {
    id: "a-1",
    name: "Sony 4K Projector",
    photo: "",
    category: "AV Equipment",
    serialNumber: "SNY-4K-00123",
    assignedTo: "Marcus Johnson",
    condition: "excellent",
    purchaseDate: "2025-11-01",
    purchasePrice: 2400,
    location: "Storage Room A",
    notes: "Includes carrying case and 2 spare bulbs",
    inventoryId: "inv-1",
    status: "available",
    createdAt: "2025-11-05T10:00:00Z",
    tags: ["AV", "projection"],
  },
  {
    id: "a-2",
    name: "Yamaha PA System",
    photo: "",
    category: "Audio",
    serialNumber: "YMH-PA-00456",
    assignedTo: "Sarah Chen",
    condition: "good",
    purchaseDate: "2025-09-15",
    purchasePrice: 1800,
    location: "Storage Room A",
    notes: "2x speaker cabinets, 1 mixer, all cables included",
    inventoryId: "inv-1",
    status: "in-use",
    createdAt: "2025-09-20T10:00:00Z",
    tags: ["audio", "speakers"],
  },
  {
    id: "a-3",
    name: "LED Panel 200W",
    photo: "",
    category: "Lighting",
    serialNumber: "LED-200W-0078",
    assignedTo: "Marcus Johnson",
    condition: "excellent",
    purchaseDate: "2026-01-20",
    purchasePrice: 560,
    location: "Warehouse B",
    notes: "Set of 4 panels",
    inventoryId: "inv-2",
    status: "available",
    createdAt: "2026-01-25T10:00:00Z",
    tags: ["lighting"],
  },
  {
    id: "a-4",
    name: 'Display Monitor 27"',
    photo: "",
    category: "Display",
    serialNumber: "DEL-27-00891",
    assignedTo: "Lisa Park",
    condition: "good",
    purchaseDate: "2025-08-10",
    purchasePrice: 450,
    location: "Office",
    notes: "Dell UltraSharp",
    inventoryId: "inv-3",
    status: "in-use",
    createdAt: "2025-08-15T10:00:00Z",
    tags: ["display", "office"],
  },
  {
    id: "a-5",
    name: 'MacBook Pro 14"',
    photo: "",
    category: "Computer",
    serialNumber: "APL-MBP-01234",
    assignedTo: "David Kim",
    condition: "excellent",
    purchaseDate: "2025-12-01",
    purchasePrice: 2499,
    location: "Office",
    notes: "M3 Pro chip, 18GB RAM",
    inventoryId: "inv-3",
    status: "in-use",
    createdAt: "2025-12-05T10:00:00Z",
    tags: ["computer", "laptop"],
  },
  {
    id: "a-6",
    name: "Canon EOS R5 Camera",
    photo: "",
    category: "Camera",
    serialNumber: "CAN-R5-00567",
    assignedTo: "Emily Torres",
    condition: "excellent",
    purchaseDate: "2026-02-10",
    purchasePrice: 3899,
    location: "Media Closet",
    notes: "With 24-70mm lens and 2 batteries",
    inventoryId: "inv-2",
    status: "available",
    createdAt: "2026-02-15T10:00:00Z",
    tags: ["camera", "photography"],
  },
  {
    id: "a-7",
    name: "Portable Stage Platform",
    photo: "",
    category: "Stage",
    serialNumber: "STG-PLT-00234",
    assignedTo: "Marcus Johnson",
    condition: "fair",
    purchaseDate: "2024-06-15",
    purchasePrice: 1200,
    location: "Warehouse B",
    notes: "8 modular sections, needs minor repair on section 3",
    inventoryId: "inv-1",
    status: "maintenance",
    createdAt: "2024-06-20T10:00:00Z",
    tags: ["stage", "furniture"],
  },
  {
    id: "a-8",
    name: "Wireless Microphone Set",
    photo: "",
    category: "Audio",
    serialNumber: "SHR-WL-00345",
    assignedTo: "Sarah Chen",
    condition: "good",
    purchaseDate: "2025-10-05",
    purchasePrice: 890,
    location: "Storage Room A",
    notes: "Shure BLX288/PG58 dual set",
    inventoryId: "inv-1",
    status: "available",
    createdAt: "2025-10-10T10:00:00Z",
    tags: ["audio", "wireless"],
  },
];

const defaultStockItems: StockItem[] = [
  {
    id: "s-1",
    name: "Folding Tables",
    category: "Furniture",
    sku: "TBL-FOLD-6FT",
    description: "6ft rectangular folding tables",
    totalQuantity: 50,
    unit: "pcs",
    notes: "Stored in Warehouse B",
    createdAt: "2025-01-01T08:00:00Z",
  },
  {
    id: "s-2",
    name: "Folding Chairs",
    category: "Furniture",
    sku: "CHR-FOLD-STD",
    description: "Standard padded folding chairs",
    totalQuantity: 200,
    unit: "pcs",
    notes: "Stack of 10 per bundle",
    createdAt: "2025-01-01T08:00:00Z",
  },
  {
    id: "s-3",
    name: "Extension Cords (10m)",
    category: "Electrical",
    sku: "EXT-10M-3PIN",
    description: "10-meter 3-pin extension cords",
    totalQuantity: 30,
    unit: "pcs",
    notes: "Heavy duty, outdoor safe",
    createdAt: "2025-01-01T08:00:00Z",
  },
  {
    id: "s-4",
    name: "Tablecloths",
    category: "Linens",
    sku: "TCL-6FT-WHT",
    description: "White tablecloths for 6ft tables",
    totalQuantity: 100,
    unit: "pcs",
    notes: "Machine washable polyester",
    createdAt: "2025-01-01T08:00:00Z",
  },
  {
    id: "s-5",
    name: "Name Badge Holders",
    category: "Stationery",
    sku: "NBH-LNY-CLR",
    description: "Clear name badge holders with lanyards",
    totalQuantity: 500,
    unit: "pcs",
    notes: "Box of 100",
    createdAt: "2025-01-01T08:00:00Z",
  },
  {
    id: "s-6",
    name: "Power Strips (6 outlet)",
    category: "Electrical",
    sku: "PWR-6OTL-SRG",
    description: "6-outlet surge-protected power strips",
    totalQuantity: 20,
    unit: "pcs",
    notes: "Surge protection, 2m cord",
    createdAt: "2025-01-01T08:00:00Z",
  },
  {
    id: "s-7",
    name: "Projector Screens",
    category: "AV",
    sku: "SCR-100IN-TRP",
    description: "100-inch tripod projector screens",
    totalQuantity: 8,
    unit: "pcs",
    notes: "Portable, with carry bag",
    createdAt: "2025-01-01T08:00:00Z",
  },
  {
    id: "s-8",
    name: "Microphone Stands",
    category: "Audio",
    sku: "MIC-STD-BLK",
    description: "Adjustable boom microphone stands",
    totalQuantity: 15,
    unit: "pcs",
    notes: "Heavy base, adjustable boom",
    createdAt: "2025-01-01T08:00:00Z",
  },
];

const defaultInventoryStockEntries: InventoryStockEntry[] = [
  {
    id: "ise-1",
    inventoryId: "inv-1",
    stockItemId: "s-1",
    quantityBrought: 10,
    notes: "For speaker tables and registration",
    createdAt: "2026-01-10T09:00:00Z",
  },
  {
    id: "ise-2",
    inventoryId: "inv-1",
    stockItemId: "s-2",
    quantityBrought: 80,
    notes: "Audience seating",
    createdAt: "2026-01-10T09:00:00Z",
  },
  {
    id: "ise-3",
    inventoryId: "inv-1",
    stockItemId: "s-3",
    quantityBrought: 5,
    notes: "Stage and AV area power",
    createdAt: "2026-01-10T09:00:00Z",
  },
  {
    id: "ise-4",
    inventoryId: "inv-1",
    stockItemId: "s-7",
    quantityBrought: 2,
    notes: "Main stage and breakout room",
    createdAt: "2026-01-10T09:00:00Z",
  },
  {
    id: "ise-5",
    inventoryId: "inv-1",
    stockItemId: "s-8",
    quantityBrought: 6,
    notes: "Speakers and Q&A",
    createdAt: "2026-01-10T09:00:00Z",
  },
  {
    id: "ise-6",
    inventoryId: "inv-2",
    stockItemId: "s-1",
    quantityBrought: 5,
    notes: "Demo and display tables",
    createdAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "ise-7",
    inventoryId: "inv-2",
    stockItemId: "s-2",
    quantityBrought: 40,
    notes: "Guest seating",
    createdAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "ise-8",
    inventoryId: "inv-2",
    stockItemId: "s-5",
    quantityBrought: 100,
    notes: "Guest name badges",
    createdAt: "2026-02-01T10:00:00Z",
  },
  {
    id: "ise-9",
    inventoryId: "inv-2",
    stockItemId: "s-4",
    quantityBrought: 20,
    notes: "Display table coverings",
    createdAt: "2026-02-01T10:00:00Z",
  },
];

interface AssetContextType {
  assets: Asset[];
  inventories: Inventory[];
  stockItems: StockItem[];
  inventoryStockEntries: InventoryStockEntry[];
  addAsset: (asset: Omit<Asset, "id" | "createdAt">) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  addInventory: (inventory: Omit<Inventory, "id" | "createdAt">) => void;
  updateInventory: (id: string, updates: Partial<Inventory>) => void;
  deleteInventory: (id: string) => void;
  getInventoryAssets: (inventoryId: string) => Asset[];
  // Stock
  addStockItem: (item: Omit<StockItem, "id" | "createdAt">) => void;
  updateStockItem: (id: string, updates: Partial<StockItem>) => void;
  deleteStockItem: (id: string) => void;
  // Inventory stock entries
  addInventoryStockEntry: (entry: Omit<InventoryStockEntry, "id" | "createdAt">) => void;
  updateInventoryStockEntry: (id: string, updates: Partial<InventoryStockEntry>) => void;
  deleteInventoryStockEntry: (id: string) => void;
  getInventoryStockEntries: (inventoryId: string) => InventoryStockEntry[];
  getStockItemAllocated: (stockItemId: string) => number;
  getStockItemAvailable: (stockItemId: string) => number;
  INVENTORY_COLORS: string[];
}

const AssetContext = createContext<AssetContextType | null>(null);

export function AssetProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
      const stored = localStorage.getItem("assets");
      return stored ? JSON.parse(stored) : defaultAssets;
    } catch {
      return defaultAssets;
    }
  });

  const [inventories, setInventories] = useState<Inventory[]>(() => {
    try {
      const stored = localStorage.getItem("inventories");
      return stored ? JSON.parse(stored) : defaultInventories;
    } catch {
      return defaultInventories;
    }
  });

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    try {
      const stored = localStorage.getItem("stockItems");
      return stored ? JSON.parse(stored) : defaultStockItems;
    } catch {
      return defaultStockItems;
    }
  });

  const [inventoryStockEntries, setInventoryStockEntries] = useState<InventoryStockEntry[]>(() => {
    try {
      const stored = localStorage.getItem("inventoryStockEntries");
      return stored ? JSON.parse(stored) : defaultInventoryStockEntries;
    } catch {
      return defaultInventoryStockEntries;
    }
  });

  useEffect(() => {
    localStorage.setItem("assets", JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem("inventories", JSON.stringify(inventories));
  }, [inventories]);

  useEffect(() => {
    localStorage.setItem("stockItems", JSON.stringify(stockItems));
  }, [stockItems]);

  useEffect(() => {
    localStorage.setItem("inventoryStockEntries", JSON.stringify(inventoryStockEntries));
  }, [inventoryStockEntries]);

  // Assets
  const addAsset = (asset: Omit<Asset, "id" | "createdAt">) => {
    const newAsset: Asset = {
      ...asset,
      id: `a-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAssets((prev) => [newAsset, ...prev]);
  };

  const updateAsset = (id: string, updates: Partial<Asset>) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  // Inventories
  const addInventory = (inventory: Omit<Inventory, "id" | "createdAt">) => {
    const newInventory: Inventory = {
      ...inventory,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setInventories((prev) => [newInventory, ...prev]);
  };

  const updateInventory = (id: string, updates: Partial<Inventory>) => {
    setInventories((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  const deleteInventory = (id: string) => {
    setInventories((prev) => prev.filter((i) => i.id !== id));
    setAssets((prev) => prev.filter((a) => a.inventoryId !== id));
    setInventoryStockEntries((prev) => prev.filter((e) => e.inventoryId !== id));
  };

  const getInventoryAssets = (inventoryId: string) =>
    assets.filter((a) => a.inventoryId === inventoryId);

  // Stock items
  const addStockItem = (item: Omit<StockItem, "id" | "createdAt">) => {
    const newItem: StockItem = {
      ...item,
      id: `s-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setStockItems((prev) => [newItem, ...prev]);
  };

  const updateStockItem = (id: string, updates: Partial<StockItem>) => {
    setStockItems((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteStockItem = (id: string) => {
    setStockItems((prev) => prev.filter((s) => s.id !== id));
    setInventoryStockEntries((prev) => prev.filter((e) => e.stockItemId !== id));
  };

  // Inventory stock entries
  const addInventoryStockEntry = (entry: Omit<InventoryStockEntry, "id" | "createdAt">) => {
    const newEntry: InventoryStockEntry = {
      ...entry,
      id: `ise-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setInventoryStockEntries((prev) => [newEntry, ...prev]);
  };

  const updateInventoryStockEntry = (id: string, updates: Partial<InventoryStockEntry>) => {
    setInventoryStockEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const deleteInventoryStockEntry = (id: string) => {
    setInventoryStockEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const getInventoryStockEntries = (inventoryId: string) =>
    inventoryStockEntries.filter((e) => e.inventoryId === inventoryId);

  const getStockItemAllocated = (stockItemId: string) =>
    inventoryStockEntries
      .filter((e) => e.stockItemId === stockItemId)
      .reduce((sum, e) => sum + e.quantityBrought, 0);

  const getStockItemAvailable = (stockItemId: string) => {
    const item = stockItems.find((s) => s.id === stockItemId);
    if (!item) return 0;
    return item.totalQuantity - getStockItemAllocated(stockItemId);
  };

  return (
    <AssetContext.Provider
      value={{
        assets,
        inventories,
        stockItems,
        inventoryStockEntries,
        addAsset,
        updateAsset,
        deleteAsset,
        addInventory,
        updateInventory,
        deleteInventory,
        getInventoryAssets,
        addStockItem,
        updateStockItem,
        deleteStockItem,
        addInventoryStockEntry,
        updateInventoryStockEntry,
        deleteInventoryStockEntry,
        getInventoryStockEntries,
        getStockItemAllocated,
        getStockItemAvailable,
        INVENTORY_COLORS,
      }}
    >
      {children}
    </AssetContext.Provider>
  );
}

export function useAssets() {
  const ctx = useContext(AssetContext);
  if (!ctx) throw new Error("useAssets must be used within AssetProvider");
  return ctx;
}

