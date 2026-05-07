import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Plus,
  Package,
  Eye,
  Edit2,
  Trash2,
  Download,
  Search,
  CheckCircle,
  Clock,
  Wrench,
  Archive,
  X,
  Package2,
  AlertCircle,
  Save,
  Layers,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useAssets, Asset, InventoryStockEntry } from "../store/assetContext";
import { AssetDetailModal } from "./AssetDetailModal";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  available: "#22c55e",
  "in-use": "#6366f1",
  maintenance: "#f97316",
  retired: "#94a3b8",
};

const STATUS_ICONS = {
  available: CheckCircle,
  "in-use": Clock,
  maintenance: Wrench,
  retired: Archive,
};

const CONDITION_COLORS: Record<string, string> = {
  excellent: "bg-green-100 text-green-700",
  good: "bg-blue-100 text-blue-700",
  fair: "bg-yellow-100 text-yellow-700",
  poor: "bg-red-100 text-red-700",
};

type ActiveTab = "assets" | "materials";

export function InventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    inventories,
    assets,
    deleteAsset,
    stockItems,
    inventoryStockEntries,
    addInventoryStockEntry,
    updateInventoryStockEntry,
    deleteInventoryStockEntry,
    getInventoryStockEntries,
    getStockItemAvailable,
    getStockItemAllocated,
  } = useAssets();

  const inventory = inventories.find((i) => i.id === id);
  const invAssets = useMemo(
    () => assets.filter((a) => a.inventoryId === id),
    [assets, id]
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>("assets");
  const [search, setSearch] = useState("");
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Materials state
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editEntryId, setEditEntryId] = useState<string | null>(null);
  const [materialForm, setMaterialForm] = useState({ stockItemId: "", quantityBrought: 1, notes: "" });
  const [materialErrors, setMaterialErrors] = useState<Record<string, string>>({});
  const [deleteMaterialConfirm, setDeleteMaterialConfirm] = useState<string | null>(null);

  if (!inventory) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Inventory not found.</p>
        <button
          onClick={() => navigate("/inventories")}
          className="mt-3 text-indigo-600 text-sm hover:text-indigo-800"
        >
          Back to Inventories
        </button>
      </div>
    );
  }

  const filtered = invAssets.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.assignedTo.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalValue = invAssets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);
  const statusCounts = invAssets.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleDelete = (assetId: string) => {
    deleteAsset(assetId);
    setDeleteConfirm(null);
    toast.success("Asset deleted");
  };

  const handleExport = () => {
    const rows = filtered.map((a) => ({
      Name: a.name,
      Category: a.category,
      "Serial Number": a.serialNumber,
      "Assigned To": a.assignedTo,
      Status: a.status,
      Condition: a.condition,
      Location: a.location,
      "Purchase Date": a.purchaseDate,
      "Purchase Price": a.purchasePrice,
      Notes: a.notes,
      Tags: a.tags.join(", "),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, inventory.name);
    XLSX.writeFile(wb, `${inventory.name.replace(/\s+/g, "-")}-assets.xlsx`);
    toast.success(`Exported ${rows.length} assets`);
  };

  // â”€â”€ Materials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const entries = getInventoryStockEntries(id!);

  const openAddMaterial = () => {
    setMaterialForm({ stockItemId: "", quantityBrought: 1, notes: "" });
    setEditEntryId(null);
    setMaterialErrors({});
    setShowMaterialForm(true);
  };

  const openEditMaterial = (entry: InventoryStockEntry) => {
    setMaterialForm({
      stockItemId: entry.stockItemId,
      quantityBrought: entry.quantityBrought,
      notes: entry.notes,
    });
    setEditEntryId(entry.id);
    setMaterialErrors({});
    setShowMaterialForm(true);
  };

  const handleMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!materialForm.stockItemId) errs.stockItemId = "Please select a stock item";
    if (materialForm.quantityBrought <= 0) errs.quantityBrought = "Quantity must be greater than 0";

    // Check availability
    if (materialForm.stockItemId) {
      const currentlyAllocated = editEntryId
        ? inventoryStockEntries.find((e) => e.id === editEntryId)?.quantityBrought || 0
        : 0;
      const available = getStockItemAvailable(materialForm.stockItemId) + currentlyAllocated;
      if (materialForm.quantityBrought > available) {
        errs.quantityBrought = `Only ${available} units available in stock`;
      }
    }

    if (Object.keys(errs).length > 0) { setMaterialErrors(errs); return; }

    if (editEntryId) {
      updateInventoryStockEntry(editEntryId, {
        quantityBrought: materialForm.quantityBrought,
        notes: materialForm.notes,
      });
      toast.success("Material allocation updated");
    } else {
      addInventoryStockEntry({
        inventoryId: id!,
        stockItemId: materialForm.stockItemId,
        quantityBrought: materialForm.quantityBrought,
        notes: materialForm.notes,
      });
      toast.success("Material added to event");
    }
    setShowMaterialForm(false);
  };

  const handleDeleteMaterial = (entryId: string) => {
    deleteInventoryStockEntry(entryId);
    setDeleteMaterialConfirm(null);
    toast.success("Material removed from event");
  };

  // Stock items not yet added to this inventory (for add modal)
  const existingStockItemIds = new Set(entries.map((e) => e.stockItemId));
  const availableStockItems = editEntryId
    ? stockItems
    : stockItems.filter((s) => !existingStockItemIds.has(s.id));

  const totalMaterialsAllocated = entries.reduce((s, e) => s + e.quantityBrought, 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button
          onClick={() => navigate("/inventories")}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 mt-0.5"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: inventory.color }}
            />
            <h1 className="text-gray-900 truncate">{inventory.name}</h1>
            {inventory.event && (
              <span className="text-sm text-gray-500">- {inventory.event}</span>
            )}
          </div>
          {inventory.description && (
            <p className="text-sm text-gray-500 mt-0.5 ml-5">{inventory.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <Download size={13} /> Export
          </button>
          <button
            onClick={() => navigate(`/assets/new?inventory=${id}`)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
          >
            <Plus size={13} /> Add Asset
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>{invAssets.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Assets</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>${totalValue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">Assets Value</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>{statusCounts["available"] || 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Available</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>{statusCounts["maintenance"] || 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">In Maintenance</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-2xl text-purple-700" style={{ fontWeight: 700 }}>{entries.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Materials ({totalMaterialsAllocated} units)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("assets")}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${
            activeTab === "assets"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
          style={{ fontWeight: activeTab === "assets" ? 500 : 400 }}
        >
          <div className="flex items-center gap-1.5">
            <Package size={14} />
            Assets
            <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full ml-0.5">
              {invAssets.length}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("materials")}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${
            activeTab === "materials"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
          style={{ fontWeight: activeTab === "materials" ? 500 : 400 }}
        >
          <div className="flex items-center gap-1.5">
            <Layers size={14} />
            Event Materials
            <span className="bg-purple-100 text-purple-600 text-xs px-1.5 py-0.5 rounded-full ml-0.5">
              {entries.length}
            </span>
          </div>
        </button>
      </div>

      {/* â”€â”€ Assets Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === "assets" && (
        <>
          {/* Search & Status filter */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[180px]">
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assets..."
                className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {["all", "available", "in-use", "maintenance", "retired"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors
                    ${statusFilter === s
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                >
                  {s === "all" ? "All" : s.replace("-", " ")}
                  {s !== "all" && statusCounts[s] !== undefined && (
                    <span className="ml-1 text-gray-400">({statusCounts[s] || 0})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Asset Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wide">Asset</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wide">Category</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wide">Assigned To</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wide">Condition</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wide">Value</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <Package size={36} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">
                          {invAssets.length === 0
                            ? "No assets in this inventory yet"
                            : "No assets match your search"}
                        </p>
                        {invAssets.length === 0 && (
                          <button
                            onClick={() => navigate(`/assets/new`)}
                            className="mt-3 text-indigo-600 text-sm hover:text-indigo-800"
                          >
                            Add first asset
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((asset) => {
                      const StatusIcon = STATUS_ICONS[asset.status] || CheckCircle;
                      return (
                        <tr key={asset.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {asset.photo ? (
                                <img src={asset.photo} alt={asset.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Package size={14} className="text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{asset.name}</p>
                                <p className="text-xs text-gray-400">{asset.serialNumber || "No serial"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><span className="text-sm text-gray-600">{asset.category}</span></td>
                          <td className="px-4 py-3">
                            {asset.assignedTo ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs flex-shrink-0">
                                  {asset.assignedTo[0].toUpperCase()}
                                </div>
                                <span className="text-sm text-gray-700 truncate max-w-[100px]">{asset.assignedTo}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                              style={{
                                backgroundColor: STATUS_COLORS[asset.status] + "20",
                                color: STATUS_COLORS[asset.status],
                              }}
                            >
                              <StatusIcon size={10} />
                              {asset.status.replace("-", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${CONDITION_COLORS[asset.condition]}`}>
                              {asset.condition}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700">
                              {asset.purchasePrice ? `$${asset.purchasePrice.toLocaleString()}` : "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setDetailAsset(asset)}
                                className="p-1.5 rounded-md hover:bg-indigo-50 text-gray-400 hover:text-indigo-600"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => navigate(`/assets/${asset.id}/edit`)}
                                className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(asset.id)}
                                className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* â”€â”€ Materials Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === "materials" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              Materials and consumables brought from the main stock list for this event
            </p>
            <button
              onClick={openAddMaterial}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
            >
              <Plus size={13} /> Add Material
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wide">Item</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wide">Category</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wide">Brought to Event</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wide">Total in Stock</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wide">Remaining in Stock</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wide">Notes</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <Package2 size={36} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">No materials assigned to this event yet</p>
                        <button
                          onClick={openAddMaterial}
                          className="mt-3 text-indigo-600 text-sm hover:text-indigo-800"
                        >
                          Add first material
                        </button>
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => {
                      const stockItem = stockItems.find((s) => s.id === entry.stockItemId);
                      if (!stockItem) return null;
                      const totalAllocated = getStockItemAllocated(stockItem.id);
                      const remaining = stockItem.totalQuantity - totalAllocated;
                      const remainingPct = stockItem.totalQuantity > 0 ? (remaining / stockItem.totalQuantity) * 100 : 100;
                      const isLow = remainingPct < 20 && stockItem.totalQuantity > 0;
                      return (
                        <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package2 size={13} className="text-purple-400" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{stockItem.name}</p>
                                {stockItem.sku && (
                                  <p className="text-xs text-gray-400 font-mono">{stockItem.sku}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">{stockItem.category || "-"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm text-indigo-700" style={{ fontWeight: 700 }}>
                                {entry.quantityBrought}
                              </span>
                              <span className="text-xs text-gray-400">{stockItem.unit}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700">{stockItem.totalQuantity} {stockItem.unit}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-sm"
                                style={{
                                  fontWeight: 600,
                                  color: remaining === 0 ? "#ef4444" : isLow ? "#f97316" : "#22c55e",
                                }}
                              >
                                {remaining} {stockItem.unit}
                              </span>
                              <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.max(0, Math.min(100, remainingPct))}%`,
                                    backgroundColor: remaining === 0 ? "#ef4444" : isLow ? "#f97316" : "#22c55e",
                                  }}
                                />
                              </div>
                              {isLow && remaining > 0 && (
                                <AlertCircle size={12} className="text-orange-400 flex-shrink-0" title="Low stock" />
                              )}
                              {remaining === 0 && (
                                <AlertCircle size={12} className="text-red-400 flex-shrink-0" title="Out of stock" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-500 truncate max-w-[120px] block">{entry.notes || "-"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditMaterial(entry)}
                                className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteMaterialConfirm(entry.id)}
                                className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {entries.length > 0 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{entries.length} material type{entries.length !== 1 ? "s" : ""}</span>
                  <span className="text-purple-600" style={{ fontWeight: 500 }}>
                    {totalMaterialsAllocated} total units brought
                  </span>
                </div>
                <button
                  onClick={() => navigate("/stock")}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  View full stock list
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Detail Modal */}
      {detailAsset && (
        <AssetDetailModal asset={detailAsset} onClose={() => setDetailAsset(null)} />
      )}

      {/* Delete Asset Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Delete Asset</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Material Modal */}
      {showMaterialForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-gray-900">
                {editEntryId ? "Edit Material Allocation" : "Add Material to Event"}
              </h3>
              <button onClick={() => setShowMaterialForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleMaterialSubmit} className="p-5 space-y-4">
              {!editEntryId && (
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Stock Item <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={materialForm.stockItemId}
                    onChange={(e) => {
                      setMaterialForm((p) => ({ ...p, stockItemId: e.target.value }));
                      setMaterialErrors((p) => ({ ...p, stockItemId: "" }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 bg-white
                      ${materialErrors.stockItemId ? "border-red-400" : "border-gray-200"}`}
                  >
                    <option value="">Select a stock item...</option>
                    {availableStockItems.map((s) => {
                      const avail = getStockItemAvailable(s.id);
                      return (
                        <option key={s.id} value={s.id} disabled={avail === 0}>
                          {s.name} ({avail} {s.unit} available)
                        </option>
                      );
                    })}
                  </select>
                  {materialErrors.stockItemId && (
                    <p className="text-xs text-red-500 mt-1">{materialErrors.stockItemId}</p>
                  )}
                  {availableStockItems.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      All stock items are already added to this event.{" "}
                      <button
                        type="button"
                        onClick={() => navigate("/stock")}
                        className="text-indigo-600 hover:underline"
                      >
                        Manage stock
                      </button>
                    </p>
                  )}
                </div>
              )}

              {editEntryId && (() => {
                const item = stockItems.find((s) => s.id === materialForm.stockItemId);
                return item ? (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                    <Package2 size={16} className="text-indigo-500" />
                    <div>
                      <p className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{item.name}</p>
                      <p className="text-xs text-gray-500">{item.category} ? {item.sku}</p>
                    </div>
                  </div>
                ) : null;
              })()}

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Quantity to Bring <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={materialForm.quantityBrought}
                    onChange={(e) => {
                      setMaterialForm((p) => ({ ...p, quantityBrought: parseInt(e.target.value) || 0 }));
                      setMaterialErrors((p) => ({ ...p, quantityBrought: "" }));
                    }}
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300
                      ${materialErrors.quantityBrought ? "border-red-400" : "border-gray-200"}`}
                  />
                  {materialForm.stockItemId && (() => {
                    const item = stockItems.find((s) => s.id === materialForm.stockItemId);
                    const currentEntry = editEntryId
                      ? inventoryStockEntries.find((e) => e.id === editEntryId)?.quantityBrought || 0
                      : 0;
                    const avail = item ? getStockItemAvailable(item.id) + currentEntry : 0;
                    return (
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        / {avail} {item?.unit || "pcs"} available
                      </span>
                    );
                  })()}
                </div>
                {materialErrors.quantityBrought && (
                  <p className="text-xs text-red-500 mt-1">{materialErrors.quantityBrought}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={materialForm.notes}
                  onChange={(e) => setMaterialForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. For registration tables"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMaterialForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Save size={14} /> {editEntryId ? "Save Changes" : "Add Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Material Confirm */}
      {deleteMaterialConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Remove Material</h3>
            <p className="text-sm text-gray-500 mb-5">
              This will free up the allocated units back to the main stock.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteMaterialConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMaterial(deleteMaterialConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

