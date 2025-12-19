// src/hooks/useRoutePreview.ts

/**
 * CONTEXT: COMMUTEWISE LIVE ROUTE PREVIEW HOOK
 * ============================================
 * THIS HOOK:
 * - WATCHES ROUTE BUILDER POINTS + STOP MARKERS
 * - WHEN ALL POINTS MAP TO REAL STOPS, CALLS MAPBOX DIRECTIONS
 * - WRITES THE RESULTING GEOJSON LINESTRING + METRICS INTO ZUSTAND
 *
 * THE MAP COMPONENT THEN READS routeGeometry FROM THE STORE
 * AND DRAWS THE LINE ON TOP OF MAPBOX.
 */

import { useEffect, useRef } from "react";
import { useRouteStore } from "../store/useRouteStore";
import { useRouteBuilderStore } from "../store/useRouteBuilderStore";
import { calculateRoutePath } from "../services/routeService";
import type { Stop } from "../types";

export function useRoutePreview() {
  // CAPS LOCK COMMENT: ALL STOPS (MARKERS) CURRENTLY LOADED FROM SUPABASE
  const markers = useRouteStore((state) => state.markers);

  // CAPS LOCK COMMENT: SELECT ONLY FIELDS NEEDED FOR PREVIEW CALCULATION
  const {
    points,
    transportMode,
    isBuilding,
    setRouteGeometry,
    setRouteMetricsFromApi,
  } = useRouteBuilderStore((state) => ({
    points: state.points,
    transportMode: state.transportMode,
    isBuilding: state.isBuilding,
    setRouteGeometry: state.setRouteGeometry,
    setRouteMetricsFromApi: state.setRouteMetricsFromApi,
  }));

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  // CAPS LOCK COMMENT: TRACK LATEST REQUEST TO AVOID RACE CONDITIONS
  const latestRequestIdRef = useRef(0);

  useEffect(() => {
    // CAPS LOCK COMMENT: READ CURRENT BUILDER STATE WITHOUT SUBSCRIBING
    // CAPS LOCK COMMENT: THIS LETS US COMPARE EXISTING GEOMETRY/METRICS
    const builderState = useRouteBuilderStore.getState();

    // CAPS LOCK COMMENT: HELPER TO CLEAR ROUTE ONLY IF THERE IS SOMETHING TO CLEAR
    const clearRouteIfNeeded = () => {
      const hasGeometry = builderState.routeGeometry !== null;
      const hasMetrics = builderState.distance !== 0 || builderState.eta !== 0;

      if (hasGeometry || hasMetrics) {
        setRouteGeometry(null);
        setRouteMetricsFromApi(0, 0);
      }
    };

    // CAPS LOCK COMMENT: IF ROUTE BUILDER IS NOT ACTIVE, CLEAR ANY EXISTING PREVIEW ONCE
    if (!isBuilding) {
      clearRouteIfNeeded();
      return;
    }

    // CAPS LOCK COMMENT: NEED AT LEAST TWO POINTS TO FORM A ROUTE
    if (!points || points.length < 2) {
      clearRouteIfNeeded();
      return;
    }

    // CAPS LOCK COMMENT: RESOLVE EACH ROUTE POINT -> ACTUAL STOP OBJECT
    const stopById = new Map(markers.map((m) => [m.id, m]));
    const orderedStops: Stop[] = [];

    for (const point of points) {
      if (!point.stopId) {
        // CAPS LOCK COMMENT: UNSELECTED POINT -> CANNOT COMPUTE ROUTE YET
        clearRouteIfNeeded();
        return;
      }

      const stop = stopById.get(point.stopId);
      if (!stop) {
        // CAPS LOCK COMMENT: REFERENCED STOP NO LONGER EXISTS -> NO ROUTE
        clearRouteIfNeeded();
        return;
      }

      orderedStops.push(stop);
    }

    if (orderedStops.length < 2) {
      clearRouteIfNeeded();
      return;
    }

    if (!mapboxToken) {
      console.warn(
        "COMMUTEWISE: VITE_MAPBOX_TOKEN MISSING -> CANNOT COMPUTE ROUTE PREVIEW."
      );
      clearRouteIfNeeded();
      return;
    }

    // CAPS LOCK COMMENT: SET UP CANCELLATION/DEBOUNCE SAFETY
    latestRequestIdRef.current += 1;
    const requestId = latestRequestIdRef.current;
    let cancelled = false;

    (async () => {
      try {
        // CAPS LOCK COMMENT: CONVERT STOPS -> DIRECTIONS API INPUT STRUCTURE
        const directionsStops = orderedStops.map((s) => ({
          id: s.id,
          latitude: s.lat,
          longitude: s.lng,
        }));

        // CAPS LOCK COMMENT: FOR ALL MOTORIZED MODES WE USE THE 'driving' PROFILE
        // (BUS, JEEPNEY, E-JEEPNEY, TRICYCLE). WALKING MODES COULD USE 'walking'.
        const profile: "driving" | "walking" = "driving";

        const SNAP_RADIUS_METERS = 50; // STABLE BUT FLEXIBLE AROUND TERMINALS

        const result = await calculateRoutePath(
          directionsStops,
          mapboxToken,
          profile,
          SNAP_RADIUS_METERS
        );

        // CAPS LOCK COMMENT: DROP STALE RESPONSES
        if (cancelled || requestId !== latestRequestIdRef.current) return;

        if (!result) {
          clearRouteIfNeeded();
          return;
        }

        // CAPS LOCK COMMENT: UPDATE GLOBAL STORE WITH GEOJSON + METRICS
        setRouteGeometry(result.geometry);
        setRouteMetricsFromApi(result.distance, result.duration);
      } catch (error) {
        console.error("COMMUTEWISE: FAILED TO CALCULATE ROUTE PREVIEW:", error);
        if (!cancelled) {
          clearRouteIfNeeded();
        }
      }
    })();

    return () => {
      // CAPS LOCK COMMENT: FLAG THIS EFFECT RUN AS CANCELLED
      cancelled = true;
    };
  }, [
    isBuilding,
    points,
    markers,
    transportMode, // RESERVED FOR FUTURE PROFILE MAPPING
    mapboxToken,
    setRouteGeometry,
    setRouteMetricsFromApi,
  ]);
}
