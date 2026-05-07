import {
  X,
  Edit2,
  Package,
  MapPin,
  User,
  Tag,
  Calendar,
  DollarSign,
  Hash,
  FileText,
  CheckCircle,
  Clock,
  Wrench,
  Archive,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Asset, useAssets } from "../store/assetContext";

const STATUS_COLORS: Record<string, string> = {
  available: "#22c55e",
  "in-use": "#6366f1",
  maintenance: "#f97316",
  retired: "#94a3b8",
};

const CONDITION_COLORS: Record<string, string> = {
  excellent: "bg-green-100 text-green-700",
  good: "bg-blue-100 text-blue-700",
  fair: "bg-yellow-100 text-yellow-700",
  poor: "bg-red-100 text-red-700",
};

const STATUS_ICONS = {
  available: CheckCircle,
  "in-use": Clock,
  maintenance: Wrench,
  retired: Archive,
};

interface Props {
  asset: Asset;
  onClose: () => void;
}

export function AssetDetailModal({ asset, onClose }: Props) {
  const navigate = useNavigate();
  const { inventories } = useAssets();
  const inventory = inventories.find((i) => i.id === asset.inventoryId);
  const StatusIcon = STATUS_ICONS[asset.status] || CheckCircle;

  const fields = [
    { icon: Hash, label: "Serial Number", value: asset.serialNumber || "-" },
    { icon: User, label: "Assigned To", value: asset.assignedTo || "Unassigned" },
    { icon: MapPin, label: "Location", value: asset.location || "-" },
    {
      icon: Calendar,
      label: "Purchase Date",
      value: asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : "-",
    },
    {
      icon: DollarSign,
      label: "Purchase Price",
      value: asset.purchasePrice ? `$${asset.purchasePrice.toLocaleString()}` : "-",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {asset.photo ? (
              <img src={asset.photo} alt={asset.name} className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Package size={20} className="text-gray-400" />
              </div>
            )}
            <div>
              <h2 className="text-gray-900">{asset.name}</h2>
              <span className="text-sm text-gray-500">{asset.category}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
            style={{ backgroundColor: STATUS_COLORS[asset.status] + "20", color: STATUS_COLORS[asset.status] }}
          >
            <StatusIcon size={11} />
            <span className="capitalize">{asset.status.replace("-", " ")}</span>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs ${CONDITION_COLORS[asset.condition]}`}>
            {asset.condition.charAt(0).toUpperCase() + asset.condition.slice(1)} condition
          </div>
          {inventory && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ml-auto"
              style={{ backgroundColor: inventory.color + "20", color: inventory.color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: inventory.color }}
              />
              {inventory.name}
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          {fields.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={13} className="text-gray-400" />
              </div>
              <div className="flex-1 flex items-baseline justify-between">
                <span className="text-xs text-gray-400">{label}</span>
                <span className="text-sm text-gray-800 ml-2 text-right">{value}</span>
              </div>
            </div>
          ))}
        </div>

        {asset.tags.length > 0 && (
          <div className="px-5 pb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Tag size={12} className="text-gray-400" />
              <span className="text-xs text-gray-400">Tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {asset.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {asset.notes && (
          <div className="px-5 pb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <FileText size={12} className="text-gray-400" />
              <span className="text-xs text-gray-400">Notes</span>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{asset.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Added {new Date(asset.createdAt).toLocaleDateString()}
          </p>
          <button
            onClick={() => {
              onClose();
              navigate(`/assets/${asset.id}/edit`);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
          >
            <Edit2 size={13} /> Edit Asset
          </button>
        </div>
      </div>
    </div>
  );
}
