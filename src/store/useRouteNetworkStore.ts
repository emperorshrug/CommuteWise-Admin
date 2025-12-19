// src/store/useRouteNetworkStore.ts

/**
 * CONTEXT: COMMUTEWISE ROUTE NETWORK STORE
 * ========================================
 * THIS STORE HOLDS:
 * - ALL ROUTES (WITH GEOMETRY + METADATA)
 * - ALL ROUTE_STOPS (ORDERED STOP IDS PER ROUTE)
 * - HOVER / FOCUS STATE FOR MAP HIGHLIGHTING
 * - CURRENTLY EDITED ROUTE (FOR RouteEditForm OVERLAY)
 *
 * IT EXPOSES:
 * - reload(): FETCHES routes + route_stops FROM SUPABASE
 * - startEditRoute / clearEditingRoute
 * - setHoverRouteId / setFocusedTerminalId
 */

import { create } from "zustand";
import {
  fetchAllRoutes,
  fetchRouteStops,
  type RouteRow,
  type RouteStopRow,
} from "../services/routeService";

interface RouteNetworkState {
  routes: RouteRow[];
  routeStops: RouteStopRow[];

  isLoading: boolean;
  error: string | null;

  // CAPS LOCK COMMENT: ID OF ROUTE CURRENTLY HOVERED IN THE UI (USED FOR MAP HIGHLIGHTING)
  hoverRouteId: string | null;

  // CAPS LOCK COMMENT: ID OF TERMINAL STOP (stops.id) CURRENTLY FOCUSED
  focusedTerminalId: string | null;

  // CAPS LOCK COMMENT: ROUTE CURRENTLY BEING EDITED VIA RouteEditForm
  editingRoute: RouteRow | null;

  // ACTIONS
  reload: () => Promise<void>;
  setHoverRouteId: (routeId: string | null) => void;
  setFocusedTerminalId: (terminalId: string | null) => void;
  startEditRoute: (route: RouteRow) => void;
  clearEditingRoute: () => void;
}

export const useRouteNetworkStore = create<RouteNetworkState>((set) => ({
  routes: [],
  routeStops: [],
  isLoading: false,
  error: null,

  hoverRouteId: null,
  focusedTerminalId: null,
  editingRoute: null,

  // CAPS LOCK COMMENT: FETCH ROUTES + ROUTE_STOPS FROM SUPABASE AND STORE THEM LOCALLY
  reload: async () => {
    set({ isLoading: true, error: null });
    try {
      // CAPS LOCK COMMENT: BOTH CALLS HANDLE THEIR OWN LOGGING; fetchRouteStops RETURNS [] ON RLS ERROR
      const [routes, routeStops] = await Promise.all([
        fetchAllRoutes(),
        fetchRouteStops(),
      ]);

      set({
        routes,
        routeStops,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error("COMMUTEWISE: FAILED TO RELOAD ROUTE NETWORK:", err);
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  setHoverRouteId: (routeId) => set({ hoverRouteId: routeId }),
  setFocusedTerminalId: (terminalId) => set({ focusedTerminalId: terminalId }),

  startEditRoute: (route) => set({ editingRoute: route }),
  clearEditingRoute: () => set({ editingRoute: null }),
}));
