import { useState } from "react";
import { useNavigate } from "react-router";
import {
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  ArrowRight,
  Calendar,
  Package,
  X,
  Save,
} from "lucide-react";
import { useAssets, Inventory } from "../store/assetContext";
import { toast } from "sonner";

type InventoryForm = Omit<Inventory, "id" | "createdAt">;

const empty: InventoryForm = {
  name: "",
  event: "",
  description: "",
  date: "",
  color: "#6366f1",
};

export function Inventories() {
  const { inventories, assets, addInventory, updateInventory, deleteInventory, INVENTORY_COLORS } =
    useAssets();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<InventoryForm>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setForm(empty);
    setEditId(null);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (inv: Inventory) => {
    const { id: _id, createdAt: _c, ...rest } = inv;
    setForm(rest);
    setEditId(inv.id);
    setErrors({});
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    try {
      setSaving(true);

      if (editId) {
        await updateInventory(editId, form);
        toast.success("Inventory updated");
      } else {
        await addInventory(form);
        toast.success("Inventory created");
      }

      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save inventory.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const count = assets.filter((a) => a.inventoryId === id).length;
    try {
      await deleteInventory(id);
      setDeleteConfirm(null);
      toast.success(`Inventory deleted${count > 0 ? ` (${count} assets removed)` : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete inventory.");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Inventories</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Separate asset collections for different events & projects
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
        >
          <Plus size={14} /> New Inventory
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventories.map((inv) => {
          const assetCount = assets.filter((a) => a.inventoryId === inv.id).length;
          const totalValue = assets
            .filter((a) => a.inventoryId === inv.id)
            .reduce((sum, a) => sum + (a.purchasePrice || 0), 0);
          const statuses = assets
            .filter((a) => a.inventoryId === inv.id)
            .reduce((acc, a) => {
              acc[a.status] = (acc[a.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

          return (
            <div
              key={inv.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Color band */}
              <div className="h-1.5" style={{ backgroundColor: inv.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: inv.color + "20" }}
                    >
                      <FolderOpen size={18} style={{ color: inv.color }} />
                    </div>
                    <div>
                      <h3 className="text-gray-900 truncate max-w-[160px]">{inv.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{inv.event || "No event"}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(inv)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(inv.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {inv.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{inv.description}</p>
                )}

                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <p className="text-lg text-gray-900" style={{ fontWeight: 700 }}>
                      {assetCount}
                    </p>
                    <p className="text-xs text-gray-400">Assets</p>
                  </div>
                  <div>
                    <p className="text-lg text-gray-900" style={{ fontWeight: 700 }}>
                      ${totalValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">Total Value</p>
                  </div>
                  {inv.date && (
                    <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={11} />
                      {new Date(inv.date).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Status mini bar */}
                {assetCount > 0 && (
                  <div className="flex gap-1 mb-4 overflow-hidden rounded-full h-1.5">
                    {Object.entries({
                      available: "#22c55e",
                      "in-use": "#6366f1",
                      maintenance: "#f97316",
                      retired: "#94a3b8",
                    }).map(([status, color]) => {
                      const count = statuses[status] || 0;
                      if (!count) return null;
                      return (
                        <div
                          key={status}
                          style={{
                            width: `${(count / assetCount) * 100}%`,
                            backgroundColor: color,
                          }}
                        />
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => navigate(`/inventories/${inv.id}`)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Package size={13} /> View Assets <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add new card */}
        <button
          onClick={openAdd}
          className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors min-h-[200px] text-gray-400 hover:text-indigo-500"
        >
          <Plus size={28} />
          <span className="text-sm">Create Inventory</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-gray-900">{editId ? "Edit Inventory" : "New Inventory"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Inventory Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setErrors((p) => ({ ...p, name: "" })); }}
                  placeholder="e.g. Summer Conference 2026"
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300
                    ${errors.name ? "border-red-400" : "border-gray-200"}`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Event / Project</label>
                <input
                  type="text"
                  value={form.event}
                  onChange={(e) => setForm((p) => ({ ...p, event: e.target.value }))}
                  placeholder="e.g. Annual Tech Summit"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="What assets does this inventory hold?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Event Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {INVENTORY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, color: c }))}
                      className={`w-7 h-7 rounded-full transition-all ${form.color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
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
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Save size={14} /> {saving ? "Saving..." : editId ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="text-gray-900 mb-2">Delete Inventory</h3>
            <p className="text-sm text-gray-500 mb-1">
              This will also delete all assets in this inventory.
            </p>
            <p className="text-sm text-orange-600 mb-5">
              {assets.filter((a) => a.inventoryId === deleteConfirm).length} asset(s) will be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
