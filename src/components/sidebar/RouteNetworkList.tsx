// src/components/sidebar/RouteNetworkList.tsx

/**
 * CONTEXT: COMMUTEWISE ROUTE NETWORK LIST
 * =======================================
 * NESTED HIERARCHY:
 * - BARANGAY CARD
 *   - TERMINAL CARD
 *     - ROUTE CARD
 *       - ROUTE STOPS (TIMELINE STYLE)
 *
 * ROUTE ATTACHMENT LOGIC (FIXED):
 * - PRIMARY SOURCE: public.route_stops
 *   - sequence = 0 -> ORIGIN STOP
 *   - IF ORIGIN STOP TYPE = "terminal", ATTACH ROUTE TO THAT TERMINAL
 * - FALLBACK: public.routes.origin_id
 *   - IF origin_id POINTS TO A TERMINAL AND ROUTE WAS NOT ALREADY ATTACHED
 *
 * FILTERING:
 * - TERMINAL CARDS:
 *   - type === "terminal"
 *   - terminal.vehicleTypes INCLUDES activeTab
 *   - NAME/BARANGAY MATCHES searchQuery (IF ANY)
 * - ROUTE CARDS:
 *   - route.vehicle_type MATCHES activeTab (case-insensitive)
 */

import { useState } from "react";
import {
  ChevronDown,
  Edit2,
  Trash2,
  MapPin,
  Route as RouteIcon,
} from "lucide-react";
import { useRouteStore } from "../../store/useRouteStore";
import { useRouteNetworkStore } from "../../store/useRouteNetworkStore";
import {
  deleteRoute,
  type RouteRow,
  type RouteStopRow,
} from "../../services/routeService";
import type { Stop } from "../../types";
import { getMarkerStyle } from "../../utils/markerUtils";

// CAPS LOCK COMMENT: SMALL HELPERS FOR DISPLAY FORMATTING
const formatKm = (meters: number | null | undefined): string => {
  if (!meters || meters <= 0) return "0.00 km";
  return `${(meters / 1000).toFixed(2)} km`;
};

const formatMinutes = (seconds: number | null | undefined): string => {
  if (!seconds || seconds <= 0) return "0.00 min";
  return `${(seconds / 60).toFixed(2)} min`;
};

const formatPhp = (amount: number | null | undefined): string => {
  const safe = !amount || amount < 0 ? 0 : amount;
  return `₱${safe.toFixed(2)}`;
};

// CAPS LOCK COMMENT: DISCOUNT HELPER (20% OFF) FOR DISPLAY FALLBACKS
const calculateDiscount = (fare: number | null | undefined): number => {
  if (!fare || !Number.isFinite(fare) || fare <= 0) return 0;
  const discounted = fare * 0.8;
  return Math.round(discounted * 100) / 100;
};

interface RouteNetworkListProps {
  activeTab: string;
  searchQuery: string;
}

export default function RouteNetworkList({
  activeTab,
  searchQuery,
}: RouteNetworkListProps) {
  // CAPS LOCK COMMENT: ALL STOPS (TERMINALS + REGULAR STOPS)
  const markers = useRouteStore((state) => state.markers);
  const selectMarker = useRouteStore((state) => state.selectMarker);
  const deleteMarker = useRouteStore((state) => state.deleteMarker);

  // CAPS LOCK COMMENT: ROUTE NETWORK DATA
  const routes = useRouteNetworkStore((state) => state.routes);
  const routeStops = useRouteNetworkStore((state) => state.routeStops);
  const startEditRoute = useRouteNetworkStore((state) => state.startEditRoute);
  const reloadNetwork = useRouteNetworkStore((state) => state.reload);
  const setHoverRouteId = useRouteNetworkStore(
    (state) => state.setHoverRouteId
  );

  // CAPS LOCK COMMENT: LOCAL EXPANSION STATE FOR BARANGAYS / TERMINALS / ROUTES
  const [expandedBarangays, setExpandedBarangays] = useState<
    Record<string, boolean>
  >({});
  const [expandedTerminals, setExpandedTerminals] = useState<
    Record<string, boolean>
  >({});
  const [expandedRoutes, setExpandedRoutes] = useState<Record<string, boolean>>(
    {}
  );

  // CAPS LOCK COMMENT: NORMALIZE FILTERS
  const q = searchQuery.trim().toLowerCase();
  const mode = activeTab.toLowerCase(); // "bus" | "jeepney" | "e-jeepney" | "tricycle"

  // CAPS LOCK COMMENT: MAP STOP.ID -> STOP FOR FAST LOOKUPS (ROUTE STOPS)
  const stopById = new Map<string, Stop>(
    markers.map((m) => [m.id, m] as [string, Stop])
  );

  // CAPS LOCK COMMENT: INDEX ROUTES BY ID FOR ATTACHING VIA route_stops
  const routeById = new Map<string, RouteRow>(
    routes.map((r) => [r.id, r] as [string, RouteRow])
  );

  // CAPS LOCK COMMENT: FILTER TERMINALS BASED ON TAB + SEARCH
  const filteredTerminals = markers.filter((stop) => {
    if (stop.type !== "terminal") return false;

    // VEHICLE TYPE FILTER: ONLY TERMINALS SERVING CURRENT ACTIVE TAB
    const hasMode = stop.vehicleTypes
      .map((v) => v.toLowerCase())
      .includes(mode);
    if (!hasMode) return false;

    if (!q) return true;

    const name = (stop.name || "").toLowerCase();
    const barangay = (stop.barangay || "").toLowerCase();
    return name.includes(q) || barangay.includes(q);
  });

  // CAPS LOCK COMMENT: GROUP TERMINALS BY BARANGAY
  const terminalsByBarangay = filteredTerminals.reduce((acc, terminal) => {
    const b = terminal.barangay || "Unassigned";
    if (!acc[b]) acc[b] = [];
    acc[b].push(terminal);
    return acc;
  }, {} as Record<string, Stop[]>);

  // CAPS LOCK COMMENT: PRIMARY GROUPING - ROUTES BY ORIGIN TERMINAL USING route_stops
  // - sequence = 0 -> ORIGIN STOP
  // - IF ORIGIN STOP IS A TERMINAL, ATTACH ROUTE TO THAT TERMINAL
  const routesByOriginTerminalId: Record<string, RouteRow[]> = {};
  const assignedRouteIds = new Set<string>();

  routeStops.forEach((rs: RouteStopRow) => {
    if (rs.sequence !== 0) return;
    const originStop = stopById.get(rs.stop_id);
    if (!originStop || originStop.type !== "terminal") return;

    const route = routeById.get(rs.route_id);
    if (!route) return;

    // CAPS LOCK COMMENT: FILTER ROUTE BY CURRENT VEHICLE MODE
    if (
      !route.vehicle_type ||
      route.vehicle_type.toLowerCase().trim() !== mode
    ) {
      return;
    }

    if (!routesByOriginTerminalId[originStop.id]) {
      routesByOriginTerminalId[originStop.id] = [];
    }
    routesByOriginTerminalId[originStop.id].push(route);
    assignedRouteIds.add(route.id);
  });

  // CAPS LOCK COMMENT: FALLBACK GROUPING - USE routes.origin_id FOR UNASSIGNED ROUTES
  routes.forEach((route) => {
    if (!route.origin_id) return;
    if (assignedRouteIds.has(route.id)) return;

    // VEHICLE TYPE FILTER
    if (
      !route.vehicle_type ||
      route.vehicle_type.toLowerCase().trim() !== mode
    ) {
      return;
    }

    const originStop = stopById.get(route.origin_id);
    if (!originStop || originStop.type !== "terminal") return;

    if (!routesByOriginTerminalId[originStop.id]) {
      routesByOriginTerminalId[originStop.id] = [];
    }
    routesByOriginTerminalId[originStop.id].push(route);
    assignedRouteIds.add(route.id);
  });

  const handleToggleBarangay = (barangay: string) => {
    setExpandedBarangays((prev) => ({
      ...prev,
      [barangay]: !prev[barangay],
    }));
  };

  const handleToggleTerminal = (terminalId: string) => {
    setExpandedTerminals((prev) => ({
      ...prev,
      [terminalId]: !prev[terminalId],
    }));
  };

  const handleToggleRoute = (routeId: string) => {
    setExpandedRoutes((prev) => ({
      ...prev,
      [routeId]: !prev[routeId],
    }));
  };

  const handleDeleteRoute = async (routeId: string) => {
    const ok = window.confirm("Delete this route? This cannot be undone.");
    if (!ok) return;
    try {
      await deleteRoute(routeId);
      await reloadNetwork();
    } catch (error) {
      console.error("COMMUTEWISE: FAILED TO DELETE ROUTE:", error);
      alert("Failed to delete route. Check console for details.");
    }
  };

  const handleEditTerminal = (terminal: Stop) => {
    // CAPS LOCK COMMENT: USE EXISTING STOP EDIT FLOW VIA selectMarker
    selectMarker(terminal);
  };

  const handleDeleteTerminal = async (terminal: Stop) => {
    const ok = window.confirm(
      "Delete this terminal? Routes using it as origin will lose their origin reference."
    );
    if (!ok) return;
    try {
      await deleteMarker(terminal.id);
      await reloadNetwork();
    } catch (error) {
      console.error("COMMUTEWISE: FAILED TO DELETE TERMINAL:", error);
      alert("Failed to delete terminal. Check console for details.");
    }
  };

  const barangayEntries = Object.entries(terminalsByBarangay);

  if (barangayEntries.length === 0) {
    // CAPS LOCK COMMENT: NO TERMINALS MATCH FILTER -> NO ROUTES TO SHOW
    return (
      <div className="mt-4 px-4 pb-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-sm text-slate-400">
          No terminals or routes found for {activeTab}.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 px-4 pb-4 space-y-4">
      {barangayEntries.map(([barangay, terminals]) => {
        const isBarangayExpanded = expandedBarangays[barangay] ?? false;

        return (
          <div
            key={barangay}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            {/* BARANGAY HEADER */}
            <button
              type="button"
              onClick={() => handleToggleBarangay(barangay)}
              className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-emerald-500" />
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                  {barangay}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400 border border-slate-200">
                  {terminals.length} terminals
                </span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform ${
                    isBarangayExpanded ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </div>
            </button>

            {isBarangayExpanded && (
              <div className="divide-y divide-slate-100">
                {terminals.map((terminal) => {
                  const terminalRoutes =
                    routesByOriginTerminalId[terminal.id] ?? [];
                  const isTerminalExpanded =
                    expandedTerminals[terminal.id] ?? false;

                  const { colorClass } = getMarkerStyle(terminal.vehicleTypes);

                  return (
                    <div key={terminal.id} className="bg-white">
                      {/* TERMINAL HEADER */}
                      <div className="flex items-start justify-between gap-2 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleTerminal(terminal.id)}
                          className="flex-1 flex items-start gap-3 text-left"
                        >
                          {/* TERMINAL ICON */}
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm ${colorClass}`}
                          >
                            <span className="text-xs font-bold">T</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="font-semibold text-slate-800 text-sm truncate">
                                {terminal.name || "Unnamed Terminal"}
                              </h5>
                              <ChevronDown
                                size={14}
                                className={`text-slate-400 shrink-0 transition-transform ${
                                  isTerminalExpanded ? "rotate-0" : "-rotate-90"
                                }`}
                              />
                            </div>

                            <div className="mt-1 flex flex-wrap gap-1">
                              {/* BARANGAY TAG */}
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                                {terminal.barangay || "Unassigned"}
                              </span>

                              {/* VEHICLE TAGS */}
                              {terminal.vehicleTypes.map((v) => (
                                <span
                                  key={v}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100"
                                >
                                  {v}
                                </span>
                              ))}

                              {/* ROUTES COUNT TAG */}
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-100">
                                {terminalRoutes.length} route
                                {terminalRoutes.length === 1 ? "" : "s"}
                              </span>
                            </div>
                          </div>
                        </button>

                        {/* TERMINAL ACTIONS */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditTerminal(terminal)}
                            className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                            title="Edit Terminal"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTerminal(terminal)}
                            className="p-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors"
                            title="Delete Terminal"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* ROUTES LIST UNDER TERMINAL */}
                      {isTerminalExpanded && terminalRoutes.length > 0 && (
                        <div className="px-4 pb-3 space-y-3">
                          {terminalRoutes.map((route) => {
                            const isRouteExpanded =
                              expandedRoutes[route.id] ?? false;

                            const baseFare = route.fare_amount ?? 0;
                            const discFare =
                              route.discounted_fare_amount ??
                              calculateDiscount(baseFare);

                            // CAPS LOCK COMMENT: BUILD ORDERED STOP LIST FOR THIS ROUTE
                            const rawStops: RouteStopRow[] = routeStops.filter(
                              (rs) => rs.route_id === route.id
                            );

                            const sortedRouteStops = [...rawStops].sort(
                              (a, b) => a.sequence - b.sequence
                            );

                            let orderedStops: Stop[] = sortedRouteStops
                              .map((rs) => stopById.get(rs.stop_id))
                              .filter((s): s is Stop => !!s);

                            // CAPS LOCK COMMENT: FALLBACK IF NO ROUTE_STOPS (LEGACY DATA)
                            if (orderedStops.length < 2) {
                              const originStop = route.origin_id
                                ? stopById.get(route.origin_id)
                                : undefined;
                              const destStop = route.destination_id
                                ? stopById.get(route.destination_id)
                                : undefined;
                              orderedStops = [];
                              if (originStop) orderedStops.push(originStop);
                              if (destStop && destStop !== originStop)
                                orderedStops.push(destStop);
                            }

                            const distLabel = formatKm(route.distance_m);
                            const etaLabel = formatMinutes(route.duration_sec);

                            const vehicleLabel =
                              route.vehicle_type
                                ?.split("-")
                                .map(
                                  (s) => s.charAt(0).toUpperCase() + s.slice(1)
                                )
                                .join("-") ?? "Unknown";

                            return (
                              <div
                                key={route.id}
                                className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/80 hover:bg-slate-50 transition-colors"
                                onMouseEnter={() => setHoverRouteId(route.id)}
                                onMouseLeave={() => setHoverRouteId(null)}
                              >
                                {/* ROUTE HEADER */}
                                <div className="flex items-start justify-between gap-2 px-3 py-2.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRoute(route.id)}
                                    className="flex-1 flex items-start gap-2 text-left"
                                  >
                                    <div className="mt-0.5">
                                      <RouteIcon
                                        size={16}
                                        className="text-emerald-500"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <h6 className="font-semibold text-slate-800 text-sm truncate">
                                          {route.name}
                                        </h6>
                                        <ChevronDown
                                          size={14}
                                          className={`text-slate-400 shrink-0 transition-transform ${
                                            isRouteExpanded
                                              ? "rotate-0"
                                              : "-rotate-90"
                                          }`}
                                        />
                                      </div>

                                      {/* META SUMMARY */}
                                      <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-slate-500">
                                        <span className="px-1.5 py-0.5 rounded-full bg-white border border-slate-200">
                                          {vehicleLabel}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded-full bg-white border border-slate-200">
                                          {distLabel}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded-full bg-white border border-slate-200">
                                          {etaLabel}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                                          {formatPhp(baseFare)} /{" "}
                                          {formatPhp(discFare)}
                                        </span>
                                      </div>
                                    </div>
                                  </button>

                                  {/* ROUTE ACTIONS */}
                                  <div className="flex flex-col gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => startEditRoute(route)}
                                      className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                                      title="Edit Route"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteRoute(route.id)
                                      }
                                      className="p-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors"
                                      title="Delete Route"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>

                                {/* ROUTE STOPS TIMELINE */}
                                {isRouteExpanded && orderedStops.length > 0 && (
                                  <div className="px-4 pb-3 pt-1 bg-white">
                                    <div className="space-y-3">
                                      {orderedStops.map((stop, index) => {
                                        const isFirst = index === 0;
                                        const isLast =
                                          index === orderedStops.length - 1;

                                        let dotColor =
                                          "bg-slate-400 border-slate-500";
                                        if (isFirst)
                                          dotColor =
                                            "bg-emerald-500 border-emerald-600";
                                        else if (isLast)
                                          dotColor =
                                            "bg-rose-500 border-rose-600";

                                        return (
                                          <div
                                            key={stop.id + index}
                                            className="flex items-start gap-3"
                                          >
                                            {/* TIMELINE COLUMN */}
                                            <div className="flex flex-col items-center">
                                              {/* TOP LINE (SKIP FOR FIRST NODE) */}
                                              {!isFirst && (
                                                <div className="w-px flex-1 bg-slate-300 translate-y-2" />
                                              )}
                                              {/* DOT */}
                                              <div
                                                className={`w-3 h-3 rounded-full border ${dotColor}`}
                                              />
                                              {/* BOTTOM LINE (SKIP FOR LAST NODE) */}
                                              {!isLast && (
                                                <div className="w-px flex-1 bg-slate-300" />
                                              )}
                                            </div>

                                            {/* STOP INFO */}
                                            <div className="flex-1 min-w-0 pb-3">
                                              <p className="text-sm font-semibold text-slate-800 truncate">
                                                {stop.name || "Unnamed Stop"}
                                              </p>
                                              <p className="text-[11px] text-slate-500">
                                                {isFirst
                                                  ? "Origin"
                                                  : isLast
                                                  ? "Destination"
                                                  : "Waypoint"}{" "}
                                                •{" "}
                                                {stop.type === "terminal"
                                                  ? "Terminal"
                                                  : "Stop"}
                                              </p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
