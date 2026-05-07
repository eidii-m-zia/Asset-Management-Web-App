import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Plus,
  Download,
  Eye,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Filter,
  Package,
  CheckCircle,
  Clock,
  Wrench,
  Archive,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useAssets, Asset } from "../store/assetContext";
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

type SortField = "name" | "assignedTo" | "category" | "status" | "condition" | "purchasePrice" | "location";
type SortDir = "asc" | "desc";

export function AssetList() {
  const { assets, inventories, deleteAsset } = useAssets();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedInventory, setSelectedInventory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(assets.map((a) => a.category))).sort(),
    [assets]
  );

  const filtered = useMemo(() => {
    return assets
      .filter((a) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          a.name.toLowerCase().includes(q) ||
          a.assignedTo.toLowerCase().includes(q) ||
          a.serialNumber.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q);
        const matchInv = selectedInventory === "all" || a.inventoryId === selectedInventory;
        const matchStatus = selectedStatus === "all" || a.status === selectedStatus;
        const matchCat = selectedCategory === "all" || a.category === selectedCategory;
        return matchSearch && matchInv && matchStatus && matchCat;
      })
      .sort((a, b) => {
        const av = a[sortField] as string | number;
        const bv = b[sortField] as string | number;
        const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [assets, search, selectedInventory, selectedStatus, selectedCategory, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown size={12} className="text-gray-300" />;
    return sortDir === "asc" ? (
      <ChevronUp size={12} className="text-indigo-500" />
    ) : (
      <ChevronDown size={12} className="text-indigo-500" />
    );
  };

  const handleDelete = (id: string) => {
    deleteAsset(id);
    setDeleteConfirm(null);
    toast.success("Asset deleted");
  };

  const handleExport = () => {
    const rows = filtered.map((a) => {
      const inv = inventories.find((i) => i.id === a.inventoryId);
      return {
        Name: a.name,
        Category: a.category,
        "Serial Number": a.serialNumber,
        "Assigned To": a.assignedTo,
        Status: a.status,
        Condition: a.condition,
        Location: a.location,
        "Purchase Date": a.purchaseDate,
        "Purchase Price": a.purchasePrice,
        Inventory: inv?.name || "",
        Notes: a.notes,
        Tags: a.tags.join(", "),
        "Added On": new Date(a.createdAt).toLocaleDateString(),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets");
    XLSX.writeFile(wb, "assets-export.xlsx");
    toast.success(`Exported ${rows.length} assets to Excel`);
  };

  const activeFilters = [
    selectedInventory !== "all" && inventories.find((i) => i.id === selectedInventory)?.name,
    selectedStatus !== "all" && selectedStatus,
    selectedCategory !== "all" && selectedCategory,
  ].filter(Boolean);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>All Assets</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} of {assets.length} assets</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download size={14} /> Export Excel
          </button>
          <button
            onClick={() => navigate("/assets/new")}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
          >
            <Plus size={14} /> Add Asset
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, person, serial, location..."
            className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
          />
          {search && (
            <button onClick={() => setSearch("")}><X size={14} className="text-gray-400 hover:text-gray-600" /></button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors
            ${showFilters || activeFilters.length > 0
              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
        >
          <Filter size={14} />
          Filters
          {activeFilters.length > 0 && (
            <span className="bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Inventory</label>
            <select
              value={selectedInventory}
              onChange={(e) => setSelectedInventory(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="all">All Inventories</option>
              {inventories.map((inv) => (
                <option key={inv.id} value={inv.id}>{inv.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="in-use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {activeFilters.length > 0 && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedInventory("all");
                  setSelectedStatus("all");
                  setSelectedCategory("all");
                }}
                className="px-3 py-2 text-sm text-red-500 hover:text-red-700"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sort by person quick buttons */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-gray-400">Sort by:</span>
        {(["name", "assignedTo", "category", "status", "location"] as SortField[]).map((f) => (
          <button
            key={f}
            onClick={() => handleSort(f)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-colors
              ${sortField === f
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
          >
            {f === "assignedTo" ? "Assigned Person" : f.charAt(0).toUpperCase() + f.slice(1)}
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
                  { field: "name" as SortField, label: "Asset" },
                  { field: "category" as SortField, label: "Category" },
                  { field: "assignedTo" as SortField, label: "Assigned To" },
                  { field: "status" as SortField, label: "Status" },
                  { field: "condition" as SortField, label: "Condition" },
                  { field: "location" as SortField, label: "Location" },
                  { field: "purchasePrice" as SortField, label: "Value" },
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
                    <Package size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No assets found</p>
                    <button
                      onClick={() => navigate("/assets/new")}
                      className="mt-3 text-indigo-600 text-sm hover:text-indigo-800"
                    >
                      Add your first asset
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((asset) => {
                  const StatusIcon = STATUS_ICONS[asset.status] || CheckCircle;
                  const inv = inventories.find((i) => i.id === asset.inventoryId);
                  return (
                    <tr
                      key={asset.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {asset.photo ? (
                            <img
                              src={asset.photo}
                              alt={asset.name}
                              className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                            />
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
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{asset.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        {asset.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs flex-shrink-0">
                              {asset.assignedTo[0].toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-700 truncate max-w-[110px]">{asset.assignedTo}</span>
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
                        <span className="text-sm text-gray-600 truncate max-w-[100px] block">
                          {asset.location || "-"}
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
                            className="p-1.5 rounded-md hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="View details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => navigate(`/assets/${asset.id}/edit`)}
                            className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(asset.id)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
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

      {/* Detail Modal */}
      {detailAsset && (
        <AssetDetailModal asset={detailAsset} onClose={() => setDetailAsset(null)} />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Delete Asset</h3>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete this asset? This action cannot be undone.
            </p>
            <div className="flex gap-3">
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
      )}
    </div>
  );
}

