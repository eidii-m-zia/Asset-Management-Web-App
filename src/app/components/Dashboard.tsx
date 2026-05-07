import { useNavigate } from "react-router";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  CheckCircle,
  Clock,
  Wrench,
  Archive,
  Plus,
} from "lucide-react";
import { useAssets } from "../store/assetContext";
import { SupabaseTodos } from "./SupabaseTodos";

const STATUS_COLORS: Record<string, string> = {
  available: "#22c55e",
  "in-use": "#6366f1",
  maintenance: "#f97316",
  retired: "#94a3b8",
};

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
  available: CheckCircle,
  "in-use": Clock,
  maintenance: Wrench,
  retired: Archive,
};

// â”€â”€ Custom SVG Bar Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BarChartCustom({ data }: { data: { name: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const chartH = 160;
  const barW = 28;
  const gap = 16;
  const paddingLeft = 28;
  const paddingBottom = 28;
  const totalW = data.length * (barW + gap) + paddingLeft;

  const yTicks = Array.from({ length: max + 1 }, (_, i) => i).filter(
    (v) => v === 0 || v === Math.round(max / 2) || v === max
  );

  return (
    <div className="overflow-x-auto">
      <svg
        width={Math.max(totalW, 300)}
        height={chartH + paddingBottom + 8}
        style={{ display: "block" }}
      >
        {/* Y-axis gridlines & labels */}
        {yTicks.map((tick) => {
          const y = chartH - (tick / max) * chartH;
          return (
            <g key={`ytick-${tick}`}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={totalW}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth={1}
              />
              <text
                x={paddingLeft - 4}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill="#94a3b8"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = (d.count / max) * chartH;
          const x = paddingLeft + i * (barW + gap) + gap / 2;
          const y = chartH - barH;
          return (
            <g key={`bar-${i}-${d.name}`}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                fill="#6366f1"
                rx={4}
                ry={4}
              />
              {/* Count label on top */}
              {d.count > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#6366f1"
                >
                  {d.count}
                </text>
              )}
              {/* X-axis label */}
              <text
                x={x + barW / 2}
                y={chartH + paddingBottom - 4}
                textAnchor="middle"
                fontSize={10}
                fill="#94a3b8"
              >
                {d.name.length > 8 ? `${d.name.slice(0, 7)}...` : d.name}
              </text>
            </g>
          );
        })}

        {/* X-axis baseline */}
        <line
          x1={paddingLeft}
          y1={chartH}
          x2={totalW}
          y2={chartH}
          stroke="#e2e8f0"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}

// â”€â”€ Custom SVG Donut Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DonutChart({
  data,
  colors,
}: {
  data: { name: string; value: number }[];
  colors: string[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-300 text-sm">
        No data
      </div>
    );
  }

  const cx = 75;
  const cy = 75;
  const outerR = 65;
  const innerR = 42;

  let currentAngle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      "Z",
    ].join(" ");

    return { path, color: colors[i % colors.length], ...d };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={150} height={150}>
        {slices.map((slice, i) => (
          <path
            key={`donut-slice-${i}`}
            d={slice.path}
            fill={slice.color}
            stroke="white"
            strokeWidth={2}
          />
        ))}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize={18}
          fontWeight={700}
          fill="#1e293b"
        >
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="#94a3b8">
          assets
        </text>
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
        {slices.map((slice, i) => (
          <div key={`donut-legend-${i}`} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-xs text-gray-500">{slice.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// â”€â”€ Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function Dashboard() {
  const { assets, inventories } = useAssets();
  const navigate = useNavigate();

  const totalValue = assets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);

  const statusCounts = assets.reduce(
    (acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  const categoryData = Object.entries(
    assets.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  const inventoryData = inventories.map((inv) => ({
    id: inv.id,
    name: inv.name.length > 16 ? `${inv.name.slice(0, 14)}...` : inv.name,
    count: assets.filter((a) => a.inventoryId === inv.id).length,
    color: inv.color,
  }));

  const pieColors = ["#22c55e", "#6366f1", "#f97316", "#94a3b8"];
  const statusPieData = (["available", "in-use", "maintenance", "retired"] as const)
    .filter((s) => (statusCounts[s] || 0) > 0)
    .map((s) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1).replace("-", " "),
      value: statusCounts[s] || 0,
    }));

  const recentAssets = [...assets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const maintenanceCount = statusCounts["maintenance"] || 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1>Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Overview of your asset portfolio</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Assets", value: assets.length, icon: Package, color: "bg-indigo-50 text-indigo-600", border: "border-indigo-100" },
          { label: "Total Value", value: `$${totalValue.toLocaleString()}`, icon: TrendingUp, color: "bg-green-50 text-green-600", border: "border-green-100" },
          { label: "Inventories", value: inventories.length, icon: FolderOpen, color: "bg-purple-50 text-purple-600", border: "border-purple-100" },
          { label: "Needs Attention", value: maintenanceCount, icon: AlertTriangle, color: "bg-orange-50 text-orange-600", border: "border-orange-100" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-white rounded-xl border ${stat.border} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon size={16} />
              </div>
            </div>
            <div className="text-2xl text-gray-900" style={{ fontWeight: 700 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {(["available", "in-use", "maintenance", "retired"] as const).map((s) => {
          const Icon = STATUS_ICONS[s];
          return (
            <div key={s} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: STATUS_COLORS[s] + "20", color: STATUS_COLORS[s] }}
              >
                <Icon size={15} />
              </div>
              <div>
                <div className="text-lg text-gray-900" style={{ fontWeight: 600 }}>
                  {statusCounts[s] || 0}
                </div>
                <div className="text-xs text-gray-500 capitalize">{s.replace("-", " ")}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Category bar chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-4">
          <h3 className="text-gray-900 mb-4">Assets by Category</h3>
          {categoryData.length > 0 ? (
            <BarChartCustom data={categoryData} />
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
              No asset data yet
            </div>
          )}
        </div>

        {/* Status donut chart */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <h3 className="text-gray-900 mb-4">Status Breakdown</h3>
          <DonutChart data={statusPieData} colors={pieColors} />
        </div>
      </div>

      <div className="mb-6">
        <SupabaseTodos />
      </div>

      {/* Inventory & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Inventory assets count */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Assets per Inventory</h3>
            <button
              onClick={() => navigate("/inventories")}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {inventoryData.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: inv.color }} />
                <span className="text-sm text-gray-700 flex-1 truncate">{inv.name}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 rounded-full bg-gray-100 w-24 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(5, (inv.count / Math.max(1, assets.length)) * 100)}%`,
                        backgroundColor: inv.color,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-4 text-right">{inv.count}</span>
                </div>
              </div>
            ))}
            {inventoryData.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No inventories yet</p>
            )}
          </div>
        </div>

        {/* Recent assets */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Recently Added</h3>
            <button
              onClick={() => navigate("/assets")}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {recentAssets.map((asset) => {
              const inv = inventories.find((i) => i.id === asset.inventoryId);
              return (
                <div
                  key={asset.id}
                  className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2"
                  onClick={() => navigate("/assets")}
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package size={14} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{asset.name}</p>
                    <p className="text-xs text-gray-400">{asset.category}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                      style={{
                        backgroundColor: STATUS_COLORS[asset.status] + "20",
                        color: STATUS_COLORS[asset.status],
                      }}
                    >
                      {asset.status.replace("-", " ")}
                    </span>
                    {inv && (
                      <span className="text-xs text-gray-400 truncate max-w-[90px]">{inv.name}</span>
                    )}
                  </div>
                </div>
              );
            })}
            {recentAssets.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400 mb-3">No assets yet</p>
                <button
                  onClick={() => navigate("/assets/new")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm hover:bg-indigo-100"
                >
                  <Plus size={14} /> Add First Asset
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

