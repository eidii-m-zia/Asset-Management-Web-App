import { useState } from "react";
import { NavLink, Outlet, useNavigate, Navigate } from "react-router";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Plus,
  Menu,
  X,
  BoxesIcon,
  ChevronRight,
  Bell,
  Search,
  LogOut,
  Layers,
  Settings,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useAssets } from "../store/assetContext";
import { useAuth } from "../store/authContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/assets", icon: Package, label: "All Assets" },
  { to: "/stock", icon: Layers, label: "Stock List" },
  { to: "/inventories", icon: FolderOpen, label: "Inventories" },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [accountForm, setAccountForm] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [accountError, setAccountError] = useState("");

  const { assets, inventories, stockItems } = useAssets();
  const { user, isLoggedIn, logout, updateCredentials } = useAuth();
  const navigate = useNavigate();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const openAccountSettings = () => {
    setAccountForm({
      username: user?.username || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setAccountError("");
    setShowUserMenu(false);
    setShowAccountSettings(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleAccountSave = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError("");

    if (!accountForm.username.trim()) {
      setAccountError("Username is required.");
      return;
    }

    if (!accountForm.currentPassword) {
      setAccountError("Current password is required.");
      return;
    }

    if (!accountForm.newPassword) {
      setAccountError("New password is required.");
      return;
    }

    if (accountForm.newPassword !== accountForm.confirmPassword) {
      setAccountError("New password and confirmation do not match.");
      return;
    }

    const result = updateCredentials({
      username: accountForm.username,
      currentPassword: accountForm.currentPassword,
      newPassword: accountForm.newPassword,
    });

    if (!result.success) {
      setAccountError(result.message);
      return;
    }

    toast.success(result.message);
    setShowAccountSettings(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:relative z-30 h-full bg-white border-r border-gray-200
          flex flex-col transition-all duration-300
          ${sidebarOpen ? "w-60" : "w-16"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100 min-h-[60px]">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BoxesIcon size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <span className="text-gray-900 whitespace-nowrap" style={{ fontWeight: 600 }}>
                AssetFlow
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto p-1 rounded-md hover:bg-gray-100 text-gray-500 hidden lg:flex"
          >
            <ChevronRight
              size={16}
              className={`transition-transform ${sidebarOpen ? "rotate-180" : ""}`}
            />
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1 rounded-md hover:bg-gray-100 text-gray-500 lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-3 pt-4 pb-2">
          <button
            onClick={() => {
              navigate("/assets/new");
              setMobileOpen(false);
            }}
            className={`w-full flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors
              ${sidebarOpen ? "px-3 py-2" : "p-2 justify-center"}`}
          >
            <Plus size={16} />
            {sidebarOpen && <span>Add Asset</span>}
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <p className={`text-xs text-gray-400 uppercase tracking-wider mb-2 px-2 ${!sidebarOpen && "opacity-0"}`}>
            Menu
          </p>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 py-2 rounded-lg mb-1 transition-colors text-sm
                ${isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }
                ${!sidebarOpen && "justify-center"}`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}

          {sidebarOpen && inventories.length > 0 && (
            <div className="mt-2 ml-2 border-l border-gray-100 pl-4">
              {inventories.map((inv) => (
                <NavLink
                  key={inv.id}
                  to={`/inventories/${inv.id}`}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 py-1.5 text-xs rounded-md px-1 transition-colors mb-0.5
                    ${isActive ? "text-indigo-700" : "text-gray-500 hover:text-gray-800"}`
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: inv.color }}
                  />
                  <span className="truncate">{inv.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className="border-t border-gray-100">
          {sidebarOpen && (
            <div className="px-4 py-2 flex justify-between text-xs text-gray-400">
              <span>{assets.length} Assets</span>
              <span>{stockItems.length} Stock</span>
              <span>{inventories.length} Inv.</span>
            </div>
          )}
          <div className="px-3 py-2">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors
                  ${!sidebarOpen && "justify-center"}`}
              >
                <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs flex-shrink-0" style={{ fontWeight: 600 }}>
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
                {sidebarOpen && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs text-gray-800 truncate" style={{ fontWeight: 500 }}>{user?.username}</p>
                    <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                  </div>
                )}
              </button>
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-sm text-gray-800" style={{ fontWeight: 500 }}>{user?.username}</p>
                    </div>
                    <button
                      onClick={openAccountSettings}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings size={14} />
                      Account Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-[60px] border-b border-gray-200 bg-white flex items-center px-4 gap-4 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 max-w-sm">
            <Search size={15} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-sm" style={{ fontWeight: 600 }}>
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-sm text-gray-700 hidden sm:block" style={{ fontWeight: 500 }}>
                {user?.username}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {showAccountSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-gray-900">Account Settings</h3>
              <button
                onClick={() => setShowAccountSettings(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAccountSave} className="p-5 space-y-4">
              {accountError && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
                  {accountError}
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={accountForm.username}
                  onChange={(e) =>
                    setAccountForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={accountForm.currentPassword}
                  onChange={(e) =>
                    setAccountForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={accountForm.newPassword}
                  onChange={(e) =>
                    setAccountForm((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={accountForm.confirmPassword}
                  onChange={(e) =>
                    setAccountForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAccountSettings(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Save size={14} /> Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
