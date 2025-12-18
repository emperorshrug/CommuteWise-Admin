import React from "react";
import { RouteManagerSidebar } from "./RouteManagerSidebar"; // THE ONE YOU ALREADY MADE
import { RouteManagerMap } from "./RouteManagerMap";
import { useRouteManager } from "../hooks/useRouteManager";

export const RouteManager: React.FC = () => {
  // --- USE THE CUSTOM HOOK TO GET LOGIC AND STATE ---
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
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* --- SIDEBAR COMPONENT --- */}
      {/* PASSING DOWN STATE AND HANDLERS AS PROPS */}
      <RouteManagerSidebar
        selectedMarker={selectedMarker}
        isLoading={isLoading}
        onUpdateMarker={saveMarker}
        onDeleteMarker={deleteMarker}
        onCloseSidebar={() => setSelectedMarker(null)} // DESELECT WHEN CLOSING
      />

      {/* --- MAP CONTAINER --- */}
      <div style={{ flex: 1, position: "relative" }}>
        <RouteManagerMap
          markers={markers}
          onMapClick={handleMapClick}
          onMarkerClick={setSelectedMarker}
        />

        {/* --- OPTIONAL: LOADING OVERLAY --- */}
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "white",
              padding: "10px",
              borderRadius: "8px",
              zIndex: 10,
            }}
          >
            Saving Data...
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteManager;
