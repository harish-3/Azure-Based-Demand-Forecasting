import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { Sun, Moon, User, Cloud, Bell } from "lucide-react";
import { useState } from "react";
import { fetchAlerts } from "../services/api";

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleBellClick = async () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next) {
      try {
        setNotifLoading(true);
        const data = await fetchAlerts(80);
        setNotifications(Array.isArray(data.alerts) ? data.alerts : []);
      } catch {
        setNotifications([
          {
            type: "system",
            message: "Notifications unavailable. Backend not responding.",
            severity: "low",
          },
        ]);
      } finally {
        setNotifLoading(false);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900 text-white shadow-lg border-b border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: logo + title */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="Azure Forcasting logo"
            className="w-10 h-10 rounded-2xl border border-white/20 shadow-md bg-white/10"
            loading="lazy"
          />
          <div className="leading-tight">
            <h1 className="text-lg md:text-xl font-semibold tracking-wide">Azure Forcasting</h1>
            <p className="hidden sm:block text-[11px] text-blue-100/80">
              AI-powered usage insights and optimization for your Azure workloads.
            </p>
          </div>
        </div>

        {/* Right: env badge + actions */}
        <div className="flex items-center gap-3">
          {/* Small environment badge */}
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/15 border border-white/20 text-blue-100">
            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Demo workspace
          </span>

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={handleBellClick}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 shadow-sm transition-all"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-rose-400 text-[9px] font-semibold text-white shadow">
                {notifications.length || 0}
              </span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white/95 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl z-50">
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Notifications</span>
                  <button
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                    onClick={() => setShowNotifications(false)}
                  >
                    Close
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {notifLoading ? (
                    <div className="p-3 text-[11px] text-gray-500 dark:text-gray-300">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-3 text-[11px] text-gray-500 dark:text-gray-300">No alerts</div>
                  ) : (
                    notifications.map((a, idx) => (
                      <div key={idx} className="px-3 py-2 text-xs border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800 dark:text-gray-100">{a.type}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              a.severity === "high"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            }`}
                          >
                            {a.severity || "low"}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-gray-700 dark:text-gray-300">{a.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shadow-sm border border-white/10"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon size={18} />
            ) : (
              <Sun className="text-yellow-300" size={18} />
            )}
          </button>

          {/* User chip */}
          <button
            onClick={handleLoginClick}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 shadow-inner transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center">
              <User size={17} className="text-white" />
            </div>
            <span className="hidden sm:inline text-xs font-medium">
              Sign in
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
