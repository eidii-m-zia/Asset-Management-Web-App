import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Upload, X, Camera, Save, Tag } from "lucide-react";
import { useAssets, Asset } from "../store/assetContext";
import { toast } from "sonner";

const CATEGORIES = [
  "AV Equipment", "Audio", "Lighting", "Display", "Computer",
  "Camera", "Stage", "Furniture", "Vehicle", "Tool", "Other",
];

const CONDITIONS = [
  { value: "excellent", label: "Excellent", color: "bg-green-100 text-green-700" },
  { value: "good", label: "Good", color: "bg-blue-100 text-blue-700" },
  { value: "fair", label: "Fair", color: "bg-yellow-100 text-yellow-700" },
  { value: "poor", label: "Poor", color: "bg-red-100 text-red-700" },
];

const STATUSES = [
  { value: "available", label: "Available" },
  { value: "in-use", label: "In Use" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

type FormData = Omit<Asset, "id" | "createdAt">;

const emptyForm: FormData = {
  name: "",
  photo: "",
  category: "Other",
  serialNumber: "",
  assignedTo: "",
  condition: "good",
  purchaseDate: "",
  purchasePrice: 0,
  location: "",
  notes: "",
  inventoryId: "",
  status: "available",
  tags: [],
};

export function AssetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { assets, inventories, addAsset, updateAsset } = useAssets();
  const isEdit = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existing = isEdit ? assets.find((a) => a.id === id) : null;
  const preselectedInventory = searchParams.get("inventory") || inventories[0]?.id || "";

  const [form, setForm] = useState<FormData>(() => {
    if (existing) {
      const { id: _id, createdAt: _createdAt, ...rest } = existing;
      return rest;
    }

    return {
      ...emptyForm,
      inventoryId: preselectedInventory,
    };
  });

  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isEdit && inventories.length > 0 && !form.inventoryId) {
      setForm((prev) => ({
        ...prev,
        inventoryId: searchParams.get("inventory") || inventories[0].id,
      }));
    }
  }, [form.inventoryId, inventories, isEdit, searchParams]);

  if (isEdit && !existing) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <h1 className="mb-2">Asset not found</h1>
          <p className="text-sm text-gray-500 mb-4">
            The asset you tried to edit no longer exists.
          </p>
          <button
            type="button"
            onClick={() => navigate("/assets")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
          >
            Back to Assets
          </button>
        </div>
      </div>
    );
  }

  const set = (field: keyof FormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => set("photo", reader.result as string);
    reader.readAsDataURL(file);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      set("tags", [...form.tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    set("tags", form.tags.filter((t) => t !== tag));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.inventoryId) errs.inventoryId = "Please select an inventory";
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (isEdit && id) {
      updateAsset(id, form);
      toast.success("Asset updated successfully");
    } else {
      addAsset(form);
      toast.success("Asset added successfully");
    }

    navigate("/assets");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1>{isEdit ? "Edit Asset" : "Add New Asset"}</h1>
          <p className="text-sm text-gray-500">
            {isEdit ? "Update asset information" : "Fill in the details to add a new asset"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="mb-4">Photo</h3>
          <div className="flex items-start gap-4">
            <div
              className="w-28 h-28 border-2 border-dashed border-gray-200 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50 cursor-pointer hover:border-indigo-300 transition-colors flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              {form.photo ? (
                <img src={form.photo} alt="Asset" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Camera size={24} className="text-gray-300 mx-auto mb-1" />
                  <span className="text-xs text-gray-400">Add photo</span>
                </div>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhoto}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                <Upload size={14} /> Upload Photo
              </button>
              {form.photo && (
                <button
                  type="button"
                  onClick={() => set("photo", "")}
                  className="mt-2 flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                >
                  <X size={12} /> Remove photo
                </button>
              )}
              <p className="text-xs text-gray-400 mt-2">JPG, PNG up to 5MB</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">
                Asset Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Sony 4K Projector"
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 transition
                  ${errors.name ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Serial Number</label>
              <input
                type="text"
                value={form.serialNumber}
                onChange={(e) => set("serialNumber", e.target.value)}
                placeholder="e.g. SN-0012345"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Inventory <span className="text-red-500">*</span>
              </label>
              <select
                value={form.inventoryId}
                onChange={(e) => set("inventoryId", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 bg-white
                  ${errors.inventoryId ? "border-red-400" : "border-gray-200"}`}
              >
                <option value="">Select inventory...</option>
                {inventories.map((inv) => (
                  <option key={inv.id} value={inv.id}>{inv.name}</option>
                ))}
              </select>
              {errors.inventoryId && <p className="text-xs text-red-500 mt-1">{errors.inventoryId}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as Asset["status"])}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="mb-4">Assignment & Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Assigned To</label>
              <input
                type="text"
                value={form.assignedTo}
                onChange={(e) => set("assignedTo", e.target.value)}
                placeholder="Person's name or team"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. Storage Room A, Office 3"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="mb-4">Purchase Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => set("purchaseDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Purchase Price ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.purchasePrice || ""}
                onChange={(e) => set("purchasePrice", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Condition</label>
              <div className="flex gap-1.5 flex-wrap">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => set("condition", c.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all border
                      ${form.condition === c.value
                        ? `${c.color} border-current`
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="mb-4">Notes & Tags</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
                placeholder="Add any additional notes about this asset..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs"
                  >
                    <Tag size={10} />
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X size={10} className="hover:text-red-500" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
          >
            <Save size={15} />
            {isEdit ? "Save Changes" : "Add Asset"}
          </button>
        </div>
      </form>
    </div>
  );
}
