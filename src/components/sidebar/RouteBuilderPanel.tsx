/**
 * CONTEXT: COMMUTEWISE ROUTE BUILDER PANEL
 * ========================================
 * WRAPS:
 * - RouteBuilder (THE ROUTE CREATION UI)
 * - INLINE "NEW POINT" OVERLAY WHEN CREATING A STOP FROM MAP SELECTION
 *
 * NOTE:
 * - LIVE DIRECTIONS PREVIEW HAS BEEN REMOVED.
 * - ROUTE LINES ARE NOW CALCULATED ONLY WHEN THE USER SAVES A ROUTE.
 */

import RouteBuilder from "./RouteBuilder";
import StopForm from "./StopForm";
import { useRouteStore } from "../../store/useRouteStore";
import { useRouteBuilderStore } from "../../store/useRouteBuilderStore";
import type { Stop } from "../../types";

export default function RouteBuilderPanel() {
  const selectedMarker = useRouteStore((state) => state.selectedMarker);
  const selectMarker = useRouteStore((state) => state.selectMarker);
  const saveMarker = useRouteStore((state) => state.saveMarker);

  const isSelectingOnMap = useRouteBuilderStore(
    (state) => state.isSelectingOnMap
  );
  const confirmMapSelection = useRouteBuilderStore(
    (state) => state.confirmMapSelection
  );
  const cancelMapSelection = useRouteBuilderStore(
    (state) => state.cancelMapSelection
  );
  const isBuilding = useRouteBuilderStore((state) => state.isBuilding);

  // CAPS LOCK COMMENT: IF ROUTE BUILDER IS NOT ACTIVE, NOTHING TO RENDER
  if (!isBuilding) return null;

  const handleSavePoint = (
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

    // CAPS LOCK COMMENT: SAVE TO SUPABASE, THEN IF WE ARE IN MAP-SELECTION MODE
    // CAPS LOCK COMMENT: USE THE SAVED STOP TO UPDATE THE ACTIVE ROUTE POINT
    saveMarker(updated).then((saved) => {
      if (saved && isSelectingOnMap) {
        confirmMapSelection(saved);
      }
    });
  };

  const handleCancelPoint = () => {
    selectMarker(null);
    if (isSelectingOnMap) {
      cancelMapSelection();
    }
  };

  return (
    <div className="w-md bg-white h-full shadow-xl z-10 flex flex-col border-r border-slate-200 transition-all relative">
      {/* BASE LAYER: ROUTE BUILDER UI */}
      <RouteBuilder />

      {/* INLINE "NEW POINT" OVERLAY WHEN CREATING STOP FROM MAP */}
      {isSelectingOnMap && selectedMarker && (
        <div className="absolute inset-0 bg-slate-50 z-20">
          <StopForm
            key={selectedMarker.id}
            location={selectedMarker}
            barangays={["Tandang Sora", "Pasong Tamo", "Culiat", "Sangandaan"]}
            vehicleOptions={["Bus", "Jeepney", "E-Jeepney", "Tricycle"]}
            onSave={handleSavePoint}
            onCancel={handleCancelPoint}
          />
        </div>
      )}
    </div>
  );
}
