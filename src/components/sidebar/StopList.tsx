// src/components/sidebar/StopList.tsx

/**
 * CONTEXT: COMMUTEWISE STOP LIST / TERMINAL LIST
 * ==============================================
 * CURRENT BEHAVIOR (BASELINE):
 * - GROUP STOPS BY BARANGAY
 * - RENDER TERMINAL / STOP CARDS
 * - CLICKING A CARD SELECTS THE STOP (OPENS StopForm)
 *
 * THIS FILE IS NOW CLEAN OF:
 * - CONDITIONAL HOOK USAGE
 * - UNUSED VARIABLES
 *
 * LATER WE WILL EXTEND THIS TO:
 * - SHOW TERMINAL -> ROUTE CARDS -> ROUTE STOP LISTS
 * - WIRE ROUTE HOVER / EDIT / DELETE BEHAVIOR
 */

import { Navigation, ChevronDown } from "lucide-react";
import { Stop } from "../../types";
import { getMarkerStyle } from "../../utils/markerUtils";

interface StopListProps {
  stops: Stop[];
  // CAPS LOCK COMMENT: MATCHES useRouteStore().selectMarker SIGNATURE (Stop | null)
  onSelectStop: (marker: Stop | null) => void;
  activeTab: string;
}

export default function StopList({
  stops,
  onSelectStop,
  activeTab,
}: StopListProps) {
  // CAPS LOCK COMMENT: BASIC EMPTY STATE - NO HOOKS ABOVE THIS RETURN
  if (stops.length === 0) {
    return (
      <div className="p-10 text-center text-slate-400 flex flex-col items-center mt-10">
        <Navigation size={48} className="mb-4 opacity-30" />
        <p className="text-base font-semibold text-slate-500">
          No {activeTab} stops found.
        </p>
        <p className="text-xs mt-1">
          Try searching or add a new point on the map.
        </p>
      </div>
    );
  }

  // CAPS LOCK COMMENT: GROUP STOPS BY BARANGAY (NO REACT HOOKS NEEDED)
  const grouped = stops.reduce((acc, stop) => {
    const b = stop.barangay || "Unassigned";
    if (!acc[b]) acc[b] = [];
    acc[b].push(stop);
    return acc;
  }, {} as Record<string, Stop[]>);

  return (
    <div className="p-4 space-y-4">
      {Object.entries(grouped).map(([barangay, items]) => (
        <div
          key={barangay}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          {/* BARANGAY HEADER */}
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
              {barangay}
            </h4>
            <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400 border border-slate-200">
              {items.length}
            </span>
          </div>

          {/* STOP ITEMS */}
          <div className="divide-y divide-slate-50">
            {items.map((stop) => {
              const { colorClass, icon } = getMarkerStyle(stop.vehicleTypes);
              return (
                <div
                  key={stop.id}
                  onClick={() => onSelectStop(stop)}
                  className="group flex items-center gap-3 p-3 cursor-pointer hover:bg-emerald-50 transition-colors"
                >
                  {/* ICON */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm ${colorClass}`}
                  >
                    <span className="text-xs">{icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-700 text-sm truncate group-hover:text-emerald-700">
                      {stop.name || "Unnamed Point"}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {stop.type === "terminal" ? "Terminal" : "Stop"}
                    </p>
                  </div>

                  <ChevronDown
                    size={14}
                    className="text-slate-300 -rotate-90 group-hover:text-emerald-400"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
