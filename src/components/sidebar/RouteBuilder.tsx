// src/components/sidebar/RouteBuilder.tsx

/**
 * CONTEXT: COMMUTEWISE ROUTE BUILDER SHELL
 * ========================================
 * THIS COMPONENT IS PRIMARILY A VIEW + WIRING LAYER.
 *
 * IT DELEGATES:
 * - META FORM FIELDS TO RouteMetaForm
 * - ROUTE STOPS STACK TO RouteStopsList
 * - SAVE LOGIC TO useSaveRoute HOOK
 */

import { X, Save } from "lucide-react";
import { useRouteBuilderStore } from "../../store/useRouteBuilderStore";
import { useRouteStore } from "../../store/useRouteStore";
import RouteMetaForm from "./RouteMetaForm";
import RouteStopsList from "./RouteStopsList";
import { useSaveRoute } from "../../hooks/useSaveRoute";

export default function RouteBuilder() {
  const {
    points,
    routeName,
    fare,
    discountedFare,
    isFree,
    isStrict,
    transportMode,
    setField,
    addWaypoint,
    removeWaypoint,
    updatePoint,
    startMapSelection,
    swapPoints,
    cancelBuilding,
  } = useRouteBuilderStore();

  const { markers } = useRouteStore();

  const { isSaving, saveRoute } = useSaveRoute();

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* HEADER */}
      <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
        <h3 className="font-bold text-lg text-slate-800">New Route</h3>
        <button
          onClick={cancelBuilding}
          className="text-slate-400 hover:text-slate-600"
          aria-label="Close Route Builder"
        >
          <X size={20} />
        </button>
      </div>

      {/* BODY */}
      <div className="flex-1 p-4 flex flex-col gap-4 min-h-0">
        {/* META FORM */}
        <RouteMetaForm
          routeName={routeName}
          transportMode={transportMode}
          fare={fare}
          discountedFare={discountedFare}
          isFree={isFree}
          isStrict={isStrict}
          setField={setField}
        />

        <hr className="border-slate-200" />

        {/* ROUTE STOPS LIST */}
        <RouteStopsList
          points={points}
          stops={markers}
          addWaypoint={addWaypoint}
          removeWaypoint={removeWaypoint}
          updatePoint={updatePoint}
          startMapSelection={startMapSelection}
          swapPoints={swapPoints}
        />
      </div>

      {/* FOOTER */}
      <div className="p-4 bg-white border-t border-slate-200">
        <button
          onClick={saveRoute}
          disabled={isSaving}
          className="w-full bg-emerald-600 disabled:bg-emerald-400 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:cursor-not-allowed"
        >
          <Save size={18} />
          {isSaving ? "Saving Route..." : "Save Route"}
        </button>
      </div>
    </div>
  );
}
