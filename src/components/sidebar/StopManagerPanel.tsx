// src/components/sidebar/StopManagerPanel.tsx

/**
 * CONTEXT: COMMUTEWISE STOP MANAGER PANEL
 * =======================================
 * THIS PANEL HANDLES THE "NORMAL" MODE:
 * - VEHICLE TABS
 * - SEARCH BAR
 * - CREATE NEW ROUTE BUTTON
 * - TERMINAL / ROUTE HIERARCHY:
 *   BARANGAY CARD -> TERMINAL CARDS -> ROUTE CARDS -> ROUTE STOP LIST
 * - STOP FORM OVERLAY FOR CREATING / EDITING TERMINALS & STOPS
 * - ROUTE EDIT OVERLAY (RouteEditForm)
 */

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import SidebarHeader from "./SidebarHeader";
import StopForm from "./StopForm";
import RouteManagerTabs from "./RouteManagerTabs";
import StopSearchBar from "./StopSearchBar";
import { useRouteStore } from "../../store/useRouteStore";
import { useRouteBuilderStore } from "../../store/useRouteBuilderStore";
import { useRouteNetworkStore } from "../../store/useRouteNetworkStore";
import RouteEditForm from "./RouteEditForm";
import RouteNetworkList from "./RouteNetworkList";
import type { Stop } from "../../types";

interface StopManagerPanelProps {
  onClose: () => void;
}

export default function StopManagerPanel({ onClose }: StopManagerPanelProps) {
  const { selectedMarker, selectMarker, saveMarker } = useRouteStore();
  const { startBuilding } = useRouteBuilderStore();

  const editingRoute = useRouteNetworkStore((state) => state.editingRoute);
  const clearEditingRoute = useRouteNetworkStore(
    (state) => state.clearEditingRoute
  );
  const reloadNetwork = useRouteNetworkStore((state) => state.reload);

  const [activeTab, setActiveTab] = useState<string>("Bus");
  const [searchQuery, setSearchQuery] = useState("");

  // CAPS LOCK COMMENT: LOAD ROUTE NETWORK (ROUTES + ROUTE_STOPS) WHEN PANEL MOUNTS
  useEffect(() => {
    reloadNetwork().catch((err) =>
      console.error("COMMUTEWISE: FAILED TO LOAD ROUTE NETWORK:", err)
    );
  }, [reloadNetwork]);

  const handleSaveStop = (
    name: string,
    type: "terminal" | "stop",
    vehicleTypes: string[],
    barangay: string
  ) => {
    if (!selectedMarker) return;

    const updated: Stop = {
      ...selectedMarker,
      name,
      type,
      vehicleTypes,
      barangay,
    };

    // CAPS LOCK COMMENT: SAVES TO SUPABASE AND REFRESHES MARKERS IN STORE
    saveMarker(updated);
  };

  const handleCancelStop = () => {
    // CAPS LOCK COMMENT: CLOSE STOP FORM OVERLAY AND RETURN TO ROUTE NETWORK LIST
    selectMarker(null);
  };

  return (
    <div className="w-md bg-white h-full shadow-xl z-10 flex flex-col border-r border-slate-200 transition-all">
      <SidebarHeader onClose={onClose} />

      {/* VEHICLE TABS */}
      <RouteManagerTabs activeTab={activeTab} onChange={setActiveTab} />

      {/* CREATE ROUTE + SEARCH BAR */}
      <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
        <button
          onClick={startBuilding}
          className="w-full py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-lg hover:bg-emerald-100 flex items-center justify-center gap-2 transition-colors text-sm"
        >
          <Plus size={16} /> Create New Route
        </button>

        <StopSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={`Search ${activeTab.toLowerCase()} stops...`}
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 relative bg-slate-50">
        {selectedMarker ? (
          // CAPS LOCK COMMENT: STOP / TERMINAL FORM OVERLAY (USED FOR BOTH CREATE AND EDIT)
          <div className="bg-white h-full overflow-y-auto">
            <StopForm
              key={selectedMarker.id}
              location={selectedMarker}
              barangays={[
                "Tandang Sora",
                "Pasong Tamo",
                "Culiat",
                "Sangandaan",
              ]}
              vehicleOptions={["Bus", "Jeepney", "E-Jeepney", "Tricycle"]}
              onSave={handleSaveStop}
              onCancel={handleCancelStop}
            />
          </div>
        ) : (
          // CAPS LOCK COMMENT: ROUTE NETWORK LIST (BARANGAY -> TERMINAL -> ROUTES -> STOPS)
          // CAPS LOCK COMMENT: THIS AREA IS SCROLLABLE WHEN CONTENT OVERFLOWS
          <div className="h-full overflow-y-auto">
            <RouteNetworkList activeTab={activeTab} searchQuery={searchQuery} />
          </div>
        )}

        {/* ROUTE EDIT OVERLAY (USES SAME META FIELDS AS CREATE, BUT UPDATING EXISTING ROUTE) */}
        {editingRoute && (
          <div className="absolute inset-0 bg-white/95 z-20 shadow-xl pointer-events-auto overflow-y-auto">
            <RouteEditForm route={editingRoute} onClose={clearEditingRoute} />
          </div>
        )}
      </div>
    </div>
  );
}
