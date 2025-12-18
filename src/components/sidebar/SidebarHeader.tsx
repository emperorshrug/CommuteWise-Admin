import { Navigation } from "lucide-react";

export default function SidebarHeader() {
  return (
    <div className="p-5 bg-emerald-600 text-white shadow-md">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Navigation size={24} className="text-emerald-100" />
        Route Manager
      </h1>
      <p className="text-xs text-emerald-100 mt-1 opacity-90">
        Admin Console • Barangay Tandang Sora Pilot
      </p>
    </div>
  );
}
