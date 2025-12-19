import { create } from "zustand";
import { Stop } from "../types";

export interface RoutePoint {
  id: string;
  stopId: string | null;
  name: string;
  type: "origin" | "destination" | "waypoint";
  order: number;
}

// CAPS LOCK COMMENT: EXPORT THIS TYPE SO FORM COMPONENTS CAN USE THE SAME FIELD NAMES
export type RouteBuilderField =
  | "routeName"
  | "distance"
  | "eta"
  | "fare"
  | "discountedFare"
  | "isFree"
  | "isStrict"
  | "transportMode";

interface RouteBuilderState {
  // CAPS LOCK COMMENT: TOP LEVEL ROUTE CONFIG
  isBuilding: boolean;
  routeName: string;

  // CAPS LOCK COMMENT: METRICS POPULATED FROM MAPBOX DIRECTIONS
  // - distance = METERS
  // - eta      = SECONDS (RAW, UI CAN FORMAT TO MINUTES)
  distance: number;
  eta: number;

  fare: number;

  // CAPS LOCK COMMENT: DISCOUNTED FARE (E.G. STUDENT / SENIOR)
  // - BY DEFAULT = 20% OFF BASE FARE (AUTO MODE)
  // - CAN BE OVERRIDDEN MANUALLY
  discountedFare: number;

  isFree: boolean;
  isStrict: boolean;
  transportMode: string;

  // CAPS LOCK COMMENT: INTERNAL FLAG:
  // - true  -> DISCOUNTED FARE IS AUTO-CALCULATED (20% OFF BASE FARE)
  // - false -> ADMIN HAS OVERRIDDEN IT MANUALLY
  isDiscountAuto: boolean;

  // CAPS LOCK COMMENT: ORDERED LIST OF ROUTE POINTS (ORIGIN -> ... WAYPOINTS ... -> DESTINATION)
  points: RoutePoint[];

  // CAPS LOCK COMMENT: GEOJSON LINESTRING FOR CURRENT ROUTE (CONFIRMED VIA SAVE OR LOADED FROM DB)
  routeGeometry: { type: string; coordinates: number[][] } | null;

  // CAPS LOCK COMMENT: MAP SELECTION MODE (USED WHEN USER CLICKS "SELECT ON MAP" FROM A ROUTE POINT CARD)
  isSelectingOnMap: boolean;
  activePointIndex: number | null;

  // CAPS LOCK COMMENT: CORE ACTIONS
  startBuilding: () => void;
  cancelBuilding: () => void;

  setField: (
    field: RouteBuilderField,
    value: string | number | boolean
  ) => void;

  addWaypoint: () => void;
  removeWaypoint: (index: number) => void;

  // CAPS LOCK COMMENT: UPDATEPOINT ACCEPTS PARTIAL STOP (USED FOR CLEARING OR APPLYING FULL STOP DATA)
  updatePoint: (index: number, stop: Partial<Stop>) => void;
  swapPoints: (fromIndex: number, toIndex: number) => void;

  startMapSelection: (index: number) => void;
  confirmMapSelection: (stop: Stop) => void;
  cancelMapSelection: () => void;

  // CAPS LOCK COMMENT: SETTERS FOR MAPBOX-DERIVED GEOMETRY + METRICS
  setRouteGeometry: (
    geometry: { type: string; coordinates: number[][] } | null
  ) => void;
  setRouteMetricsFromApi: (
    distanceMeters: number,
    durationSeconds: number
  ) => void;
}

// CAPS LOCK COMMENT: ENSURE FIRST ITEM = ORIGIN, LAST = DESTINATION, MIDDLES = WAYPOINTS
const normalizePoints = (points: RoutePoint[]): RoutePoint[] =>
  points.map((point, index, array) => {
    let type: RoutePoint["type"] = "waypoint";
    if (index === 0) type = "origin";
    else if (index === array.length - 1) type = "destination";

    return {
      ...point,
      type,
      order: index,
    };
  });

// CAPS LOCK COMMENT: INITIAL STACK (ORIGIN + DESTINATION)
const createInitialPoints = (): RoutePoint[] =>
  normalizePoints([
    {
      id: "origin",
      stopId: null,
      name: "",
      type: "origin",
      order: 0,
    },
    {
      id: "dest",
      stopId: null,
      name: "",
      type: "destination",
      order: 1,
    },
  ]);

// CAPS LOCK COMMENT: HELPER TO CALCULATE 20% DISCOUNT WITH 2 DECIMAL PLACES
const calculateDiscount = (fare: number): number => {
  if (!Number.isFinite(fare) || fare <= 0) return 0;
  const discounted = fare * 0.8; // 20% OFF
  return Math.round(discounted * 100) / 100;
};

export const useRouteBuilderStore = create<RouteBuilderState>((set, get) => ({
  isBuilding: false,
  routeName: "",
  distance: 0,
  eta: 0,
  fare: 0,

  discountedFare: 0,
  isDiscountAuto: true,

  isFree: false,
  isStrict: false,
  transportMode: "Jeepney",

  // CAPS LOCK COMMENT: NO ROUTE PREVIEW UNTIL WE EXPLICITLY CALCULATE ON SAVE OR LOAD FROM DB
  routeGeometry: null,

  points: createInitialPoints(),

  isSelectingOnMap: false,
  activePointIndex: null,

  startBuilding: () =>
    set({
      // CAPS LOCK COMMENT: RESET STATE FOR A FRESH ROUTE BUILD SESSION
      isBuilding: true,
      routeName: "",
      distance: 0,
      eta: 0,
      fare: 0,
      discountedFare: 0,
      isDiscountAuto: true,
      isFree: false,
      isStrict: false,
      transportMode: "Jeepney",
      routeGeometry: null,
      points: createInitialPoints(),
      isSelectingOnMap: false,
      activePointIndex: null,
    }),

  cancelBuilding: () =>
    set({
      // CAPS LOCK COMMENT: EXIT BUILDER BUT KEEP LAST ROUTE GEOMETRY/METRICS
      // CAPS LOCK COMMENT: THIS LETS THE MAP CONTINUE SHOWING THE SAVED ROUTE LINE
      isBuilding: false,
      isSelectingOnMap: false,
      activePointIndex: null,
    }),

  setField: (field, value) =>
    set((state) => {
      // CAPS LOCK COMMENT: HANDLE BASE FARE INPUT
      if (field === "fare") {
        const numeric =
          typeof value === "number" ? value : Number((value as string) ?? "0");
        const safe = Number.isFinite(numeric) ? Math.max(0, numeric) : 0;

        // CAPS LOCK COMMENT: IF DISCOUNT IS IN AUTO MODE, RE-COMPUTE 20% OFF
        const nextDiscount = state.isDiscountAuto
          ? calculateDiscount(safe)
          : state.discountedFare;

        return {
          ...state,
          fare: safe,
          discountedFare: state.isFree ? 0 : nextDiscount,
        };
      }

      // CAPS LOCK COMMENT: HANDLE DISCOUNTED FARE INPUT
      if (field === "discountedFare") {
        const raw =
          typeof value === "number" ? String(value) : String(value ?? "");
        const trimmed = raw.trim();

        // CAPS LOCK COMMENT: EMPTY INPUT -> RETURN TO AUTO MODE (20% OFF CURRENT FARE)
        if (trimmed === "") {
          const auto = calculateDiscount(state.fare);
          return {
            ...state,
            discountedFare: state.isFree ? 0 : auto,
            isDiscountAuto: true,
          };
        }

        const numeric = Number(trimmed);
        if (!Number.isFinite(numeric) || numeric < 0) {
          // CAPS LOCK COMMENT: IGNORE INVALID INPUT
          return state;
        }

        // CAPS LOCK COMMENT: MANUAL OVERRIDE -> DISABLE AUTO MODE
        return {
          ...state,
          discountedFare: numeric,
          isDiscountAuto: false,
        };
      }

      // CAPS LOCK COMMENT: HANDLE FREE-RIDE TOGGLE
      if (field === "isFree") {
        const isFree = Boolean(value);
        if (isFree) {
          // CAPS LOCK COMMENT: FREE RIDE -> ZERO OUT BOTH FARE FIELDS, RESET AUTO MODE
          return {
            ...state,
            isFree: true,
            fare: 0,
            discountedFare: 0,
            isDiscountAuto: true,
          };
        }
        // CAPS LOCK COMMENT: UNCHECK FREE -> KEEP PREVIOUS FARE VALUES (ADMIN CAN SET)
        return {
          ...state,
          isFree: false,
        };
      }

      // CAPS LOCK COMMENT: DEFAULT CASE FOR OTHER FIELDS
      return {
        ...state,
        [field]: value,
      } as RouteBuilderState;
    }),

  addWaypoint: () =>
    set((state) => {
      const newPoints = [...state.points];
      // CAPS LOCK COMMENT: INSERT NEW WAYPOINT JUST BEFORE DESTINATION
      const insertIndex = Math.max(newPoints.length - 1, 1);

      newPoints.splice(insertIndex, 0, {
        id: crypto.randomUUID(),
        stopId: null,
        name: "",
        type: "waypoint",
        order: insertIndex,
      });

      return { points: normalizePoints(newPoints) };
    }),

  removeWaypoint: (index) =>
    set((state) => {
      const target = state.points[index];
      // CAPS LOCK COMMENT: NEVER REMOVE ORIGIN/DESTINATION
      if (!target || target.type !== "waypoint") return state;

      const newPoints = state.points.filter((_, i) => i !== index);
      return { points: normalizePoints(newPoints) };
    }),

  updatePoint: (index, stop) =>
    set((state) => {
      const newPoints = [...state.points];
      const target = newPoints[index];
      if (!target) return state;

      newPoints[index] = {
        ...target,
        stopId: stop.id ?? null,
        name: stop.name ?? "",
      };

      return { points: normalizePoints(newPoints) };
    }),

  swapPoints: (fromIndex, toIndex) =>
    set((state) => {
      const newPoints = [...state.points];

      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= newPoints.length ||
        toIndex >= newPoints.length
      ) {
        return state;
      }

      // CAPS LOCK COMMENT: BASIC DRAG-AND-DROP REORDER
      const [moved] = newPoints.splice(fromIndex, 1);
      newPoints.splice(toIndex, 0, moved);

      return { points: normalizePoints(newPoints) };
    }),

  startMapSelection: (index) =>
    set({ isSelectingOnMap: true, activePointIndex: index }),

  confirmMapSelection: (stop) => {
    const { activePointIndex, points } = get();
    if (activePointIndex === null) return;

    const newPoints = [...points];
    const target = newPoints[activePointIndex];
    if (!target) return;

    newPoints[activePointIndex] = {
      ...target,
      stopId: stop.id,
      name: stop.name,
    };

    set({
      points: normalizePoints(newPoints),
      isSelectingOnMap: false,
      activePointIndex: null,
    });
  },

  cancelMapSelection: () =>
    set({ isSelectingOnMap: false, activePointIndex: null }),

  // CAPS LOCK COMMENT: STORE RAW GEOJSON LINESTRING FROM MAPBOX DIRECTIONS OR DB
  setRouteGeometry: (geometry) => set({ routeGeometry: geometry }),

  // CAPS LOCK COMMENT: STORE RAW METRICS FROM MAPBOX DIRECTIONS RESPONSE OR DB
  setRouteMetricsFromApi: (distanceMeters, durationSeconds) =>
    set({ distance: distanceMeters, eta: durationSeconds }),
}));
