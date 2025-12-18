import React from "react";
import RouteManagerSidebar from "../components/RouteManagerSidebar";
import { RouteManagerMap } from "../components/RouteManagerMap";
import { useRouteManager } from "../hooks/useRouteManager";

// NOTE: GlobalSidebar REMOVED from here because it is now in App.tsx

export const RouteManager: React.FC = () => {
  const {
    markers,
    selectedMarker,
    tempMarker,
    isLoading,
    setSelectedMarker,
    handleMapClick,
    saveMarker,
  } = useRouteManager();

  const handleSaveFromSidebar = (
    name: string,
    type: "terminal" | "stop",
    vehicleTypes: string[],
    barangay: string
  ) => {
    if (selectedMarker) {
      saveMarker({
        ...selectedMarker,
        name,
        type,
        vehicleTypes,
        barangay,
      });
    }
  };

  return (
    <div className="flex h-full w-full relative">
      {/* CONTEXT SIDEBAR (White, Inner) */}
      <RouteManagerSidebar
        stops={markers}
        newStopLocation={selectedMarker}
        onSaveStop={handleSaveFromSidebar}
        onCancel={() => setSelectedMarker(null)}
      />

      {/* MAP AREA */}
      <div className="flex-1 relative">
        <RouteManagerMap
          markers={markers}
          tempMarker={tempMarker}
          onMapClick={handleMapClick}
          onMarkerClick={setSelectedMarker}
        />

        {isLoading && (
          <div className="absolute top-5 right-5 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg z-50 font-bold text-emerald-600 flex items-center gap-2 border border-emerald-100">
            <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            Saving...
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteManager;
