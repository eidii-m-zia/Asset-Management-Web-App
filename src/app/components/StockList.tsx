import { Fragment, useState, useMemo } from "react";
import {
  Search,
  Plus,
  Download,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Package2,
  X,
  Save,
  AlertCircle,
  TrendingDown,
  Layers,
  CheckCircle2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useAssets, StockItem } from "../store/assetContext";
import { toast } from "sonner";

type SortField = "name" | "category" | "sku" | "totalQuantity" | "allocated" | "available" | "unit";
type SortDir = "asc" | "desc";

type StockForm = Omit<StockItem, "id" | "createdAt">;
type EnrichedStockItem = StockItem & { allocated: number; available: number };

const empty: StockForm = {
  name: "",
  category: "",
  sku: "",
  description: "",
  totalQuantity: 0,
  unit: "pcs",
  notes: "",
};

export function StockList() {
  const {
    stockItems,
    addStockItem,
    updateStockItem,
    deleteStockItem,
    getStockItemAllocated,
    getStockItemAvailable,
    inventoryStockEntries,
    inventories,
  } = useAssets();

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<StockForm>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getSortableValue = (
    item: EnrichedStockItem,
    field: SortField
  ): string | number => {
    switch (field) {
      case "allocated":
        return item.allocated;
      case "available":
        return item.available;
      default:
        return item[field];
    }
  };

  // Enrich items with computed allocation data
  const enriched = useMemo(() => {
    return stockItems.map((s) => {
      const allocated = getStockItemAllocated(s.id);
      const available = s.totalQuantity - allocated;
      return { ...s, allocated, available };
    });
  }, [stockItems, inventoryStockEntries]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enriched
      .filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.sku.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const av = getSortableValue(a, sortField);
        const bv = getSortableValue(b, sortField);
        const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [enriched, search, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown size={12} className="text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-indigo-500" /> : <ChevronDown size={12} className="text-indigo-500" />;
  };

  const openAdd = () => {
    setForm(empty);
    setEditId(null);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (item: StockItem) => {
    const { id: _id, createdAt: _c, ...rest } = item;
    setForm(rest);
    setEditId(item.id);
    setErrors({});
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (form.totalQuantity < 0) errs.totalQuantity = "Quantity cannot be negative";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (editId) {
      updateStockItem(editId, form);
      toast.success("Stock item updated");
    } else {
      addStockItem(form);
      toast.success("Stock item added");
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    const allocated = getStockItemAllocated(id);
    deleteStockItem(id);
    setDeleteConfirm(null);
    toast.success(`Stock item deleted${allocated > 0 ? ` (${allocated} units freed from inventories)` : ""}`);
  };

  const handleExport = () => {
    const rows = filtered.map((s) => ({
      Name: s.name,
      Category: s.category,
      SKU: s.sku,
      Description: s.description,
      "Total Qty": s.totalQuantity,
      Allocated: s.allocated,
      Available: s.available,
      Unit: s.unit,
      Notes: s.notes,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock List");
    XLSX.writeFile(wb, "stock-list-export.xlsx");
    toast.success(`Exported ${rows.length} stock items to Excel`);
  };

  // Summary stats
  const totalItems = stockItems.length;
  const totalUnits = stockItems.reduce((s, i) => s + i.totalQuantity, 0);
  const totalAllocated = enriched.reduce((s, i) => s + i.allocated, 0);
  const lowStockCount = enriched.filter((i) => i.available < i.totalQuantity * 0.2 && i.totalQuantity > 0).length;

  const getInventoryBreakdown = (stockItemId: string) => {
    return inventoryStockEntries
      .filter((e) => e.stockItemId === stockItemId)
      .map((e) => ({
        ...e,
        inventoryName: inventories.find((inv) => inv.id === e.inventoryId)?.name || "Unknown",
        inventoryColor: inventories.find((inv) => inv.id === e.inventoryId)?.color || "#94a3b8",
      }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Stock List</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Consumable & reusable materials — auto-synced with event inventories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download size={14} /> Export Excel
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
          >
            <Plus size={14} /> Add Stock
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Stock Items", value: totalItems, icon: Layers, color: "bg-indigo-50 text-indigo-600", border: "border-indigo-100" },
          { label: "Total Units", value: totalUnits.toLocaleString(), icon: Package2, color: "bg-blue-50 text-blue-600", border: "border-blue-100" },
          { label: "Allocated", value: totalAllocated.toLocaleString(), icon: TrendingDown, color: "bg-purple-50 text-purple-600", border: "border-purple-100" },
          { label: "Low Stock Items", value: lowStockCount, icon: AlertCircle, color: "bg-orange-50 text-orange-600", border: "border-orange-100" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-white rounded-xl border ${stat.border} p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{stat.label}</span>
              <div className={`w-7 h-7 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon size={14} />
              </div>
            </div>
            <div className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, category, SKU..."
            className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
          />
          {search && (
            <button onClick={() => setSearch("")}><X size={14} className="text-gray-400 hover:text-gray-600" /></button>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400">
          <span>{filtered.length} of {stockItems.length} items</span>
        </div>
      </div>

      {/* Sort quick buttons */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-gray-400">Sort by:</span>
        {(["name", "category", "totalQuantity", "allocated", "available"] as SortField[]).map((f) => (
          <button
            key={f}
            onClick={() => handleSort(f)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-colors
              ${sortField === f
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
          >
            {f === "totalQuantity" ? "Total Qty" : f === "allocated" ? "Allocated" : f === "available" ? "Available" : f.charAt(0).toUpperCase() + f.slice(1)}
            <SortIcon field={f} />
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {[
                  { field: "name" as SortField, label: "Item" },
                  { field: "category" as SortField, label: "Category" },
                  { field: "sku" as SortField, label: "SKU" },
                  { field: "totalQuantity" as SortField, label: "Total" },
                  { field: "allocated" as SortField, label: "Allocated" },
                  { field: "available" as SortField, label: "Available" },
                  { field: "unit" as SortField, label: "Unit" },
                ].map(({ field, label }) => (
                  <th key={field} className="text-left px-4 py-3">
                    <button
                      onClick={() => handleSort(field)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 uppercase tracking-wide"
                    >
                      {label} <SortIcon field={field} />
                    </button>
                  </th>
                ))}
                <th className="text-left px-4 py-3">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Package2 size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">
                      {stockItems.length === 0 ? "No stock items yet" : "No items match your search"}
                    </p>
                    {stockItems.length === 0 && (
                      <button
                        onClick={openAdd}
                        className="mt-3 text-indigo-600 text-sm hover:text-indigo-800"
                      >
                        Add first stock item
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const pct = item.totalQuantity > 0 ? (item.available / item.totalQuantity) * 100 : 100;
                  const isLow = pct < 20 && item.totalQuantity > 0;
                  const isExpanded = expandedRow === item.id;
                  const breakdown = isExpanded ? getInventoryBreakdown(item.id) : [];
                  return (
                    <Fragment key={item.id}>
                      <tr
                        className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer ${isExpanded ? "bg-indigo-50/20" : ""}`}
                        onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package2 size={14} className="text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-900" style={{ fontWeight: 500 }}>{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-gray-400 truncate max-w-[180px]">{item.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{item.category || "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {item.sku || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                            {item.totalQuantity.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-purple-600" style={{ fontWeight: 500 }}>
                            {item.allocated.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm"
                              style={{
                                fontWeight: 600,
                                color: isLow ? "#f97316" : item.available === 0 ? "#ef4444" : "#22c55e",
                              }}
                            >
                              {item.available.toLocaleString()}
                            </span>
                            {/* Mini progress bar */}
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.max(0, Math.min(100, pct))}%`,
                                  backgroundColor: isLow ? "#f97316" : item.available === 0 ? "#ef4444" : "#22c55e",
                                }}
                              />
                            </div>
                            {isLow && <AlertCircle size={12} className="text-orange-400 flex-shrink-0" />}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(item)}
                              className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(item.id)}
                              className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded breakdown row */}
                      {isExpanded && (
                        <tr className="border-b border-gray-100 bg-indigo-50/10">
                          <td colSpan={8} className="px-6 py-3">
                            <div className="flex items-start gap-6 flex-wrap">
                              <div>
                                <p className="text-xs text-gray-500 mb-2" style={{ fontWeight: 500 }}>
                                  Allocation breakdown by inventory
                                </p>
                                {breakdown.length === 0 ? (
                                  <p className="text-xs text-gray-400">Not allocated to any inventory</p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {breakdown.map((b) => (
                                      <div
                                        key={b.id}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs"
                                        style={{
                                          backgroundColor: b.inventoryColor + "15",
                                          borderColor: b.inventoryColor + "40",
                                          color: b.inventoryColor,
                                        }}
                                      >
                                        <span
                                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                          style={{ backgroundColor: b.inventoryColor }}
                                        />
                                        <span style={{ fontWeight: 500 }}>{b.inventoryName}</span>
                                        <span className="text-gray-500">— {b.quantityBrought} {item.unit}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {item.notes && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1" style={{ fontWeight: 500 }}>Notes</p>
                                  <p className="text-xs text-gray-600">{item.notes}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
            Click a row to see inventory allocation breakdown
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-gray-900">{editId ? "Edit Stock Item" : "Add Stock Item"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setErrors((p) => ({ ...p, name: "" })); }}
                    placeholder="e.g. Folding Tables"
                    className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300
                      ${errors.name ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    placeholder="e.g. Furniture"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                    placeholder="e.g. TBL-6FT-01"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Total Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.totalQuantity}
                    onChange={(e) => { setForm((p) => ({ ...p, totalQuantity: parseInt(e.target.value) || 0 })); setErrors((p) => ({ ...p, totalQuantity: "" })); }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300
                      ${errors.totalQuantity ? "border-red-400" : "border-gray-200"}`}
                  />
                  {errors.totalQuantity && <p className="text-xs text-red-500 mt-1">{errors.totalQuantity}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                    placeholder="pcs, boxes, sets..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    placeholder="Storage location, handling notes..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Save size={14} /> {editId ? "Save Changes" : "Add Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (() => {
        const item = stockItems.find((s) => s.id === deleteConfirm);
        const allocated = item ? getStockItemAllocated(item.id) : 0;
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-gray-900 mb-2">Delete Stock Item</h3>
              <p className="text-sm text-gray-500 mb-1">
                "{item?.name}" will be permanently deleted.
              </p>
              {allocated > 0 && (
                <p className="text-sm text-orange-600 mb-4">
                  {allocated} units currently allocated across inventories will be freed.
                </p>
              )}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
