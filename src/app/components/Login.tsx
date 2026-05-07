import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { BoxesIcon, Eye, EyeOff, LogIn, Lock, User } from "lucide-react";
import { useAuth } from "../store/authContext";
import { toast } from "sonner";

interface LoginLocationState {
  from?: {
    pathname?: string;
  };
}

export function Login() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = (location.state as LoginLocationState | null)?.from?.pathname || "/";

  if (isLoggedIn) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const success = login(username.trim(), password);
    setLoading(false);
    if (success) {
      toast.success(`Welcome back, ${username}!`);
      navigate(from, { replace: true });
    } else {
      setError("Invalid username or password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
                <BoxesIcon size={26} className="text-white" />
              </div>
              <h1 className="text-gray-900 text-center" style={{ fontSize: "1.5rem" }}>
                AssetFlow
              </h1>
              <p className="text-sm text-gray-500 mt-1 text-center">
                Sign in to manage your assets
              </p>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                  Username
                </label>
                <div className="relative">
                  <User
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your username"
                    autoComplete="username"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-gray-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-sm transition-colors mt-6"
                style={{ fontWeight: 500 }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={15} /> Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
              <p className="text-xs text-indigo-600 text-center" style={{ fontWeight: 500 }}>
                Demo credentials
              </p>
              <div className="flex justify-center gap-6 mt-1.5">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Username</p>
                  <p className="text-xs text-gray-800 font-mono" style={{ fontWeight: 600 }}>admin</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Password</p>
                  <p className="text-xs text-gray-800 font-mono" style={{ fontWeight: 600 }}>admin123</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          AssetFlow Asset Management · v2.0
        </p>
      </div>
    </div>
  );
}
