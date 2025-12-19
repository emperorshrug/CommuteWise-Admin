// src/hooks/useSaveRoute.ts

/**
 * CONTEXT: COMMUTEWISE ROUTE BUILDER SAVE HOOK
 * ============================================
 * THIS HOOK CONNECTS:
 * - ZUSTAND STORES (ROUTE BUILDER + ROUTE STORE)
 * - PURE DOMAIN LOGIC (routeBuilderService)
 * - EXTERNAL SERVICES (MAPBOX DIRECTIONS + SUPABASE ROUTES + ROUTE_STOPS)
 *
 * BEHAVIOR:
 * - DIRECTIONS API IS ONLY CALLED WHEN saveRoute() IS TRIGGERED BY THE USER.
 * - THE RESULTING GEOMETRY/METRICS ARE:
 *   1) STORED IN ZUSTAND FOR MAP RENDERING
 *   2) PERSISTED INTO public.routes
 *   3) USED TO SEED public.route_stops WITH PER-STOP FARES
 */

import { useState } from "react";
import { useRouteBuilderStore } from "../store/useRouteBuilderStore";
import { useRouteStore } from "../store/useRouteStore";
import {
  calculateRoutePath,
  saveRouteDefinition,
  saveRouteStops,
} from "../services/routeService";
import {
  validateRouteContext,
  resolveRouteStops,
  type BuildRouteContext,
} from "../services/routeBuilderService";

export function useSaveRoute() {
  const {
    routeName,
    transportMode,
    isFree,
    fare,
    discountedFare,
    isStrict,
    points,
    cancelBuilding,
    setRouteGeometry,
    setRouteMetricsFromApi,
  } = useRouteBuilderStore();

  const markers = useRouteStore((state) => state.markers);

  const [isSaving, setIsSaving] = useState(false);

  const saveRoute = async () => {
    if (isSaving) return;

    const ctx: BuildRouteContext = {
      routeName,
      transportMode,
      isFree,
      fare,
      isStrict,
      points,
      markers,
    };

    // CAPS LOCK COMMENT: RUN PURE VALIDATION FIRST SO WE CAN SHOW ALL ERRORS AT ONCE
    const errors = validateRouteContext(ctx);
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      alert("Mapbox token is missing. Please configure VITE_MAPBOX_TOKEN.");
      return;
    }

    try {
      setIsSaving(true);

      // CAPS LOCK COMMENT: RESOLVE ORIGIN/DESTINATION/ORDERED STOPS
      const { origin, destination, orderedStops } = resolveRouteStops(ctx);

      // CAPS LOCK COMMENT: TRANSFORM STOPS -> DIRECTIONS STOPS FOR MAPBOX
      const directionsStops = orderedStops.map((s) => ({
        id: s.id,
        latitude: s.lat,
        longitude: s.lng,
      }));

      // CAPS LOCK COMMENT: SNAP RADIUS = 50M -> STABLE BUT FLEXIBLE AROUND TERMINALS
      const SNAP_RADIUS_METERS = 50;

      const routeResult = await calculateRoutePath(
        directionsStops,
        mapboxToken,
        "driving",
        SNAP_RADIUS_METERS
      );

      if (!routeResult) {
        alert("Unable to calculate route path. Please adjust the stops.");
        return;
      }

      // CAPS LOCK COMMENT: UPDATE BUILDER STORE WITH FINAL, CONFIRMED ROUTE LINE
      // CAPS LOCK COMMENT: THIS GEOMETRY WILL BE RENDERED BY RouteManagerMap VIA ROUTE NETWORK STORE
      setRouteGeometry(routeResult.geometry);
      setRouteMetricsFromApi(routeResult.distance, routeResult.duration);

      const effectiveFare = ctx.isFree ? 0 : ctx.fare;
      const effectiveDiscountedFare = ctx.isFree ? 0 : discountedFare;

      // CAPS LOCK COMMENT: SAVE FULL ROUTE DEFINITION (INCLUDING GEOMETRY / METRICS) TO SUPABASE
      const savedRoute = await saveRouteDefinition({
        name: ctx.routeName.trim(),
        vehicleType: ctx.transportMode,
        originId: origin.id,
        destinationId: destination.id,
        geometry: routeResult.geometry as {
          type: "LineString";
          coordinates: number[][];
        },
        distanceMeters: routeResult.distance,
        durationSeconds: routeResult.duration,
        fareAmount: effectiveFare,
        discountedFareAmount: effectiveDiscountedFare,
        isStrict: ctx.isStrict,
      });

      // CAPS LOCK COMMENT: PERSIST ORDERED STOPS INTO public.route_stops
      // CAPS LOCK COMMENT: FOR NOW, PER-STOP FARES ARE SEEDED FROM ROUTE FARE
      const routeStopsPayload = orderedStops.map((stop, index) => ({
        stopId: stop.id,
        sequence: index,
        fareAmount: effectiveFare,
        discountedFareAmount: effectiveDiscountedFare,
      }));

      await saveRouteStops({
        routeId: savedRoute.id,
        stops: routeStopsPayload,
      });

      alert("Route saved successfully.");

      // CAPS LOCK COMMENT: EXIT BUILDER MODE BUT KEEP ROUTE LINE ON MAP
      cancelBuilding();
    } catch (error) {
      console.error("COMMUTEWISE: FAILED TO SAVE ROUTE:", error);
      alert("Failed to save route. Please check the console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  return { isSaving, saveRoute };
}
