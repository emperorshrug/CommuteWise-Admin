import React from "react";
// CAPS LOCK COMMENT: FIXED IMPORT PATHS TO POINT TO COMPONENTS AND HOOKS
import { RouteManagerSidebar } from "../components/RouteManagerSidebar";
import { RouteManagerMap } from "../components/RouteManagerMap";
import { useRouteManager } from "../hooks/useRouteManager";

export const RouteManager: React.FC = () => {
  const {
    markers,
    selectedMarker,
    isLoading,
    setSelectedMarker,
    handleMapClick,
    saveMarker,
    deleteMarker,
  } = useRouteManager();

  return (
    // CAPS LOCK COMMENT: REPLACED INLINE STYLES WITH TAILWIND FLEX UTILITIES
    <div className="flex h-screen w-screen overflow-hidden">
      {/* --- SIDEBAR --- */}
      <RouteManagerSidebar
        selectedMarker={selectedMarker}
        isLoading={isLoading}
        onUpdateMarker={saveMarker}
        onDeleteMarker={deleteMarker}
        onCloseSidebar={() => setSelectedMarker(null)}
      />

      {/* --- MAP CONTAINER --- */}
      <div className="flex-1 relative">
        <RouteManagerMap
          markers={markers}
          onMapClick={handleMapClick}
          onMarkerClick={setSelectedMarker}
        />

        {/* --- LOADING OVERLAY --- */}
        {isLoading && (
          // CAPS LOCK COMMENT: REPLACED INLINE STYLES WITH TAILWIND ABSOLUTE POSITIONING
          <div className="absolute top-5 right-5 bg-white p-2.5 rounded-lg z-10 shadow-md">
            Saving Data...
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteManager;
