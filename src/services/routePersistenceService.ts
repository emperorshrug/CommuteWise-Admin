// src/services/routePersistenceService.ts

/**
 * CONTEXT: COMMUTEWISE ROUTE PERSISTENCE LAYER
 * ============================================
 * THIS MODULE HANDLES WRITING AND READING ROUTE DEFINITIONS FROM SUPABASE.
 *
 * DB SCHEMA (public.routes):
 * ----------------------------------
 *  id                       uuid PK
 *  created_at               timestamptz
 *  name                     text
 *  vehicle_type             text
 *  origin_id                uuid (FK -> stops.id)
 *  destination_id           uuid (FK -> stops.id)
 *  geometry                 geometry(LineString, 4326)
 *  duration_sec             float8 (SECONDS)
 *  distance_m               float8 (METERS)
 *  fare_amount              float8
 *  discounted_fare_amount   float8
 *  is_strict                boolean
 *
 * DB SCHEMA (public.route_stops):
 * ----------------------------------
 *  id                       uuid PK
 *  route_id                 uuid FK -> routes.id ON DELETE CASCADE
 *  stop_id                  uuid FK -> stops.id ON DELETE CASCADE
 *  sequence                 int
 *  fare_amount              float8
 *  discounted_fare_amount   float8
 */

import { supabase } from "../lib/supabaseClient";

// CAPS LOCK COMMENT: MINIMAL TYPE FOR A ROW IN public.routes AS SEEN BY THE CLIENT
export interface RouteRow {
  id: string;
  created_at: string;
  name: string;
  vehicle_type: string;
  origin_id: string | null;
  destination_id: string | null;

  // GEOJSON-STYLE GEOMETRY FROM POSTGREST (LineString)
  geometry: { type: "LineString"; coordinates: number[][] } | null;

  duration_sec: number | null;
  distance_m: number | null;
  fare_amount: number | null;
  discounted_fare_amount: number | null;
  is_strict: boolean | null;
}

// CAPS LOCK COMMENT: MINIMAL TYPE FOR A ROW IN public.route_stops
export interface RouteStopRow {
  id: string;
  route_id: string;
  stop_id: string;
  sequence: number;
  fare_amount: number | null;
  discounted_fare_amount: number | null;
}

// CAPS LOCK COMMENT: PAYLOAD USED WHEN SAVING A NEW ROUTE
export interface RouteSavePayload {
  name: string;
  vehicleType: string;
  originId: string;
  destinationId: string;

  // GEOJSON LINESTRING FROM MAPBOX DIRECTIONS
  geometry: { type: "LineString"; coordinates: number[][] };

  distanceMeters: number; // METERS
  durationSeconds: number; // SECONDS

  fareAmount: number;
  discountedFareAmount: number;
  isStrict: boolean;
}

/**
 * SAVE ROUTE DEFINITION TO SUPABASE
 * =================================
 * INSERTS A NEW ROW INTO public.routes WITH:
 * - ORIGIN / DESTINATION
 * - VEHICLE TYPE
 * - GEOMETRY
 * - DISTANCE / DURATION
 * - FARE / DISCOUNTED FARE
 * - STRICT FLAG
 */
export async function saveRouteDefinition(
  payload: RouteSavePayload
): Promise<RouteRow> {
  const {
    name,
    vehicleType,
    originId,
    destinationId,
    geometry,
    distanceMeters,
    durationSeconds,
    fareAmount,
    discountedFareAmount,
    isStrict,
  } = payload;

  const { data, error } = await supabase
    .from("routes")
    .insert({
      name,
      vehicle_type: vehicleType.toLowerCase(), // NORMALIZE FOR CONSISTENCY
      origin_id: originId,
      destination_id: destinationId,
      geometry,
      distance_m: distanceMeters,
      duration_sec: durationSeconds,
      fare_amount: fareAmount,
      discounted_fare_amount: discountedFareAmount,
      is_strict: isStrict,
    })
    .select("*")
    .single();

  if (error) {
    console.error("COMMUTEWISE: FAILED TO SAVE ROUTE DEFINITION:", error);
    throw error;
  }

  return data as RouteRow;
}

/**
 * UPDATE ROUTE META (NAME / VEHICLE / FARE / DISCOUNT / STRICT)
 * =============================================================
 * DOES NOT TOUCH GEOMETRY OR STOPS.
 */
export async function updateRouteMeta(args: {
  id: string;
  name: string;
  vehicleType: string;
  fareAmount: number;
  discountedFareAmount: number;
  isStrict: boolean;
}): Promise<RouteRow> {
  const { id, name, vehicleType, fareAmount, discountedFareAmount, isStrict } =
    args;

  const { data, error } = await supabase
    .from("routes")
    .update({
      name,
      vehicle_type: vehicleType.toLowerCase().trim(),
      fare_amount: fareAmount,
      discounted_fare_amount: discountedFareAmount,
      is_strict: isStrict,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("COMMUTEWISE: FAILED TO UPDATE ROUTE META:", error);
    throw error;
  }

  return data as RouteRow;
}

/**
 * SAVE ROUTE STOPS TO SUPABASE
 * =============================
 * PERSISTS THE ORDERED LIST OF STOPS FOR A ROUTE INTO public.route_stops.
 *
 * USAGE:
 * - AFTER INSERTING A ROUTE, CALL THIS ONCE WITH ALL ORDERED STOPS.
 * - FOR NOW, PER-STOP FARES ARE SEEDED FROM THE ROUTE'S BASE / DISCOUNTED FARE.
 */
export async function saveRouteStops(args: {
  routeId: string;
  stops: {
    stopId: string;
    sequence: number;
    fareAmount: number | null;
    discountedFareAmount: number | null;
  }[];
}): Promise<void> {
  if (!args.stops || args.stops.length === 0) return;

  const payload = args.stops.map((s) => ({
    route_id: args.routeId,
    stop_id: s.stopId,
    sequence: s.sequence,
    fare_amount: s.fareAmount,
    discounted_fare_amount: s.discountedFareAmount,
  }));

  const { error } = await supabase.from("route_stops").insert(payload);

  if (error) {
    console.error("COMMUTEWISE: FAILED TO SAVE ROUTE STOPS:", error);
    // CAPS LOCK COMMENT: RETHROW SO CALLER (useSaveRoute) CAN SHOW A USER-FACING ERROR
    throw error;
  }
}

/**
 * FETCH ALL ROUTES FROM SUPABASE
 * ===============================
 * USED BY:
 * - MAP (FOR ROUTE LINES)
 * - SIDEBAR (FOR ROUTE LISTS)
 */
export async function fetchAllRoutes(): Promise<RouteRow[]> {
  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("COMMUTEWISE: FAILED TO FETCH ROUTES:", error);
    throw error;
  }

  return (data ?? []) as RouteRow[];
}

/**
 * FETCH ALL ROUTE_STOPS FROM SUPABASE
 * ===================================
 * USED FOR:
 * - BUILDING ROUTE CARDS WITH THEIR FULL STOP LISTS.
 * - LATER: PER-STOP FARE CALCULATIONS FOR PARTIAL TRIPS.
 *
 * RLS NOTE:
 * - IF RLS BLOCKS ACCESS (401/42501), WE LOG AND RETURN AN EMPTY ARRAY SO
 *   THE UI CAN STILL RENDER WITHOUT CRASHING.
 */
export async function fetchRouteStops(): Promise<RouteStopRow[]> {
  const { data, error } = await supabase.from("route_stops").select("*");

  if (error) {
    console.error("COMMUTEWISE: FAILED TO FETCH ROUTE STOPS:", error);
    // CAPS LOCK COMMENT: RETURN EMPTY ARRAY ON RLS ERROR TO AVOID SPAMMY THROW/RETRY LOOPS
    return [];
  }

  return (data ?? []) as RouteStopRow[];
}

/**
 * DELETE A ROUTE (AND ITS ROUTE_STOPS VIA CASCADE)
 * ================================================
 */
export async function deleteRoute(routeId: string): Promise<void> {
  const { error } = await supabase.from("routes").delete().eq("id", routeId);

  if (error) {
    console.error("COMMUTEWISE: FAILED TO DELETE ROUTE:", error);
    throw error;
  }
}
