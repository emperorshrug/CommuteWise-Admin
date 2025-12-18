import { Map, BarChart3, Settings, Users, LogOut } from "lucide-react";

interface GlobalSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export default function GlobalSidebar({
  activePage,
  onNavigate,
}: GlobalSidebarProps) {
  const menuItems = [
    { id: "routes", icon: Map, label: "Routes" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "users", icon: Users, label: "Users" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="w-16 h-screen bg-slate-900 text-white flex flex-col items-center py-4 border-r border-slate-800 shrink-0 z-50">
      {/* Brand Icon */}
      <div className="mb-8 p-2 bg-blue-600 rounded-lg">
        <Map size={24} className="text-white" />
      </div>

      {/* Navigation Items */}
      <div className="flex-1 w-full flex flex-col gap-4 items-center">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`p-3 rounded-xl transition-all duration-200 group relative ${
              activePage === item.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <item.icon size={22} />

            {/* Tooltip */}
            <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        className="p-3 text-slate-500 hover:text-red-400 transition-colors"
        title="Log Out"
      >
        <LogOut size={22} />
      </button>
    </div>
  );
}
