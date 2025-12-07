import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { Sun, Moon, User, Cloud, Bell } from "lucide-react";

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900 text-white shadow-lg border-b border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: logo + title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/15 border border-white/20 shadow-md">
            <Cloud className="w-5 h-5 text-cyan-200" />
          </div>
          <div className="leading-tight">
            <h1 className="text-lg md:text-xl font-semibold tracking-wide">
              Azure Demand Forecasting
            </h1>
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
          <button
            className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 shadow-sm transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-rose-400 text-[9px] font-semibold text-white shadow">
              3
            </span>
          </button>

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
