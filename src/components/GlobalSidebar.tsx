import React, { useState } from "react";
import {
  Map,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function GlobalSidebar() {
  const [isLocked, setIsLocked] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = isLocked || isHovered;

  return (
    <div
      className={`h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 z-50 border-r border-slate-800 ${
        isExpanded ? "w-64" : "w-16"
      }`}
      onMouseEnter={() => {
        if (!isLocked) setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* --- HEADER --- */}
      {/* ADDED 'gap-4' TO FIX CRAMPING */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 gap-4">
        {isExpanded ? (
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap min-w-0">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white shrink-0">
              CW
            </div>
            {/* TRUNCATE PREVENTS TEXT OVERFLOW */}
            <span className="font-bold text-lg tracking-tight truncate">
              CommuteWise
            </span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white shrink-0 mx-auto">
            CW
          </div>
        )}

        {/* LOCK BUTTON */}
        {isExpanded && (
          <button
            onClick={() => setIsLocked(!isLocked)}
            className="text-slate-400 hover:text-white transition-colors shrink-0"
            title={isLocked ? "Unlock Sidebar" : "Lock Sidebar"}
          >
            {isLocked ? (
              <ChevronsLeft size={20} />
            ) : (
              <ChevronsRight size={20} />
            )}
          </button>
        )}
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 py-6 flex flex-col gap-2">
        <SidebarItem
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          expanded={isExpanded}
          active={false}
        />
        <SidebarItem
          icon={<Map size={20} />}
          label="Route Manager"
          expanded={isExpanded}
          active={true}
        />
        <SidebarItem
          icon={<Settings size={20} />}
          label="Settings"
          expanded={isExpanded}
          active={false}
        />
      </nav>

      {/* --- FOOTER --- */}
      <div className="p-4 border-t border-slate-800">
        <SidebarItem
          icon={<LogOut size={20} />}
          label="Logout"
          expanded={isExpanded}
          active={false}
          variant="danger"
        />
      </div>
    </div>
  );
}

// Helper Component (No changes needed, but included for completeness)
interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  expanded: boolean;
  active: boolean;
  variant?: "default" | "danger";
}

function SidebarItem({
  icon,
  label,
  expanded,
  active,
  variant = "default",
}: SidebarItemProps) {
  const baseClass =
    "flex items-center gap-3 px-3 py-3 rounded-lg transition-all cursor-pointer group relative";
  const activeClass = active
    ? "bg-emerald-600 text-white shadow-lg"
    : "text-slate-400 hover:bg-slate-800 hover:text-white";
  const dangerClass = "text-red-400 hover:bg-red-900/20 hover:text-red-300";

  return (
    <div
      className={`mx-2 ${baseClass} ${
        variant === "danger" ? dangerClass : activeClass
      }`}
    >
      <div className="shrink-0">{icon}</div>
      <span
        className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
          expanded ? "w-auto opacity-100" : "w-0 opacity-0"
        }`}
      >
        {label}
      </span>
      {!expanded && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700 shadow-xl">
          {label}
        </div>
      )}
    </div>
  );
}
