// src/components/RouteManagerMap.tsx

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { FeatureCollection, Geometry } from "geojson";
import { Crosshair } from "lucide-react";

import { useRouteStore } from "../store/useRouteStore";
import { useRouteBuilderStore } from "../store/useRouteBuilderStore";
import { useMapbox } from "../hooks/map/useMapbox";
import { useMapMarkers } from "../hooks/map/useMapMarkers";
import { useUserLocation } from "../hooks/map/useUserLocation";
import {
  getRouteColor,
  fetchAllRoutes,
  type RouteRow,
} from "../services/routeService";
import { Stop } from "../types";
import "mapbox-gl/dist/mapbox-gl.css";

export const RouteManagerMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);

  // CAPS LOCK COMMENT: ZUSTAND SELECTORS FOR ROUTE / STOP STATE
  const markers = useRouteStore((state) => state.markers);
  const tempMarker = useRouteStore((state) => state.tempMarker);
  const handleMapClickState = useRouteStore((state) => state.handleMapClick);
  const selectMarker = useRouteStore((state) => state.selectMarker);

  const isSelectingOnMap = useRouteBuilderStore(
    (state) => state.isSelectingOnMap
  );
  const activePointIndex = useRouteBuilderStore(
    (state) => state.activePointIndex
  );
  const confirmMapSelection = useRouteBuilderStore(
    (state) => state.confirmMapSelection
  );
  const cancelMapSelection = useRouteBuilderStore(
    (state) => state.cancelMapSelection
  );
  const routeGeometry = useRouteBuilderStore((state) => state.routeGeometry);
  const transportMode = useRouteBuilderStore((state) => state.transportMode);
  const setRouteGeometry = useRouteBuilderStore(
    (state) => state.setRouteGeometry
  );
  const setRouteMetricsFromApi = useRouteBuilderStore(
    (state) => state.setRouteMetricsFromApi
  );
  const setField = useRouteBuilderStore((state) => state.setField);

  // CAPS LOCK COMMENT: TRACK IF WE HAVE ALREADY AUTO-FIT TO THE CURRENT ROUTE
  const hasFitRouteRef = useRef(false);

  const onMapClickWrapper = (lat: number, lng: number) => {
    // CAPS LOCK COMMENT: ALWAYS UPDATE ROUTE STORE MARKER LOGIC
    handleMapClickState(lat, lng);
  };

  const onMarkerClickWrapper = (marker: Stop) => {
    if (isSelectingOnMap) {
      // CAPS LOCK COMMENT: WHEN IN MAP SELECTION MODE, CLICKING AN EXISTING STOP
      // CAPS LOCK COMMENT: DIRECTLY UPDATES THE ACTIVE ROUTE POINT (NO STOP FORM)
      confirmMapSelection(marker);
    } else {
      // CAPS LOCK COMMENT: NORMAL MODE = OPEN STOP FORM FOR EDITING
      selectMarker(marker);
    }
  };

  const { map, isMapReady } = useMapbox(mapContainer, onMapClickWrapper);

  // CAPS LOCK COMMENT: USER LOCATION HOOK NOW EXPOSES A REUSABLE RECENTER FUNCTION
  const { recenterToUser } = useUserLocation(map.current);

  useMapMarkers(map.current, markers, tempMarker, onMarkerClickWrapper);

  // CAPS LOCK COMMENT: ON MOUNT, LOAD THE MOST RECENT SAVED ROUTE FROM SUPABASE
  // CAPS LOCK COMMENT: THIS MAKES THE LAST SAVED ROUTE LINE PERSISTENT AFTER REFRESH
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const routes: RouteRow[] = await fetchAllRoutes();
        if (cancelled || !routes || routes.length === 0) return;

        const latest = routes[0];

        if (latest.geometry && latest.geometry.type === "LineString") {
          setRouteGeometry(latest.geometry);
        }

        if (
          typeof latest.distance_m === "number" &&
          typeof latest.duration_sec === "number"
        ) {
          setRouteMetricsFromApi(latest.distance_m, latest.duration_sec);
        }

        if (latest.vehicle_type) {
          // CAPS LOCK COMMENT: UPDATE TRANSPORT MODE STRING FOR COLOR / UI
          const label =
            latest.vehicle_type.charAt(0).toUpperCase() +
            latest.vehicle_type.slice(1);
          setField("transportMode", label);
        }
      } catch (error) {
        console.error("COMMUTEWISE: FAILED TO LOAD SAVED ROUTES:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setRouteGeometry, setRouteMetricsFromApi, setField]);

  // CAPS LOCK COMMENT: INITIALIZE/UPDATE ROUTE LINE SOURCE + LAYER
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    const currentMap = map.current;

    // CAPS LOCK COMMENT: ADD GEOJSON SOURCE IF IT DOESN'T EXIST YET
    if (!currentMap.getSource("builder-route-line")) {
      currentMap.addSource("builder-route-line", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        } as FeatureCollection<Geometry>,
      });

      currentMap.addLayer({
        id: "builder-route-line",
        type: "line",
        source: "builder-route-line",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": getRouteColor(transportMode),
          "line-width": 4,
          "line-opacity": 0.9,
        },
      });
    }

    // CAPS LOCK COMMENT: ENSURE LINE COLOR MATCHES CURRENT TRANSPORT MODE
    try {
      currentMap.setPaintProperty(
        "builder-route-line",
        "line-color",
        getRouteColor(transportMode)
      );
    } catch {
      // CAPS LOCK COMMENT: SAFE-GUARD IF LAYER IS MISSING FOR ANY REASON
    }

    // CAPS LOCK COMMENT: CLEANUP SOURCE/LAYER WHEN COMPONENT UNMOUNTS
    return () => {
      if (!currentMap.getStyle()) return;
      if (currentMap.getLayer("builder-route-line")) {
        currentMap.removeLayer("builder-route-line");
      }
      if (currentMap.getSource("builder-route-line")) {
        currentMap.removeSource("builder-route-line");
      }
    };
  }, [isMapReady, transportMode, map]);

  // CAPS LOCK COMMENT: PUSH GEOJSON DATA INTO MAPBOX SOURCE WHEN GEOMETRY CHANGES
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    const currentMap = map.current;
    const source = currentMap.getSource("builder-route-line") as
      | mapboxgl.GeoJSONSource
      | undefined;

    if (!source) return;

    let data: FeatureCollection<Geometry>;

    if (routeGeometry && routeGeometry.coordinates.length > 0) {
      data = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: routeGeometry.coordinates,
            } as Geometry,
            properties: {},
          },
        ],
      };
    } else {
      data = {
        type: "FeatureCollection",
        features: [],
      };
    }

    source.setData(data);

    // CAPS LOCK COMMENT: AUTO-FIT MAP TO ROUTE BOUNDS THE FIRST TIME WE GET A GEOMETRY
    if (routeGeometry && routeGeometry.coordinates.length > 0) {
      if (!hasFitRouteRef.current) {
        const coords = routeGeometry.coordinates;
        const [firstLng, firstLat] = coords[0];

        const bounds = coords.reduce(
          (b, [lng, lat]) => b.extend([lng, lat]),
          new mapboxgl.LngLatBounds([firstLng, firstLat], [firstLng, firstLat])
        );

        currentMap.fitBounds(bounds, {
          padding: 80,
          maxZoom: 16,
          duration: 500,
        });

        hasFitRouteRef.current = true;
      }
    } else {
      // CAPS LOCK COMMENT: RESET FLAG WHEN GEOMETRY IS CLEARED
      hasFitRouteRef.current = false;
    }
  }, [routeGeometry, isMapReady, map]);

  // CAPS LOCK COMMENT: SINGLE RECENTER HANDLER USING THE NEW HOOK
  const handleRecenter = () => {
    recenterToUser();
  };

  const selectionLabel = activePointIndex === 0 ? "Origin" : "Stop";

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full absolute inset-0" />

      {/* CAPS LOCK COMMENT: MAP SELECTION BANNER */}
      {isSelectingOnMap && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 bg-white text-slate-900 px-6 py-3 rounded-full shadow-lg border border-emerald-200 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <span className="font-bold text-sm">
            Select {selectionLabel} Point
          </span>
          <button
            onClick={cancelMapSelection}
            className="text-emerald-600 hover:text-emerald-700 font-bold text-xs uppercase"
          >
            Cancel
          </button>
        </div>
      )}

      <button
        onClick={handleRecenter}
        className="absolute bottom-8 right-5 z-20 bg-white p-3 rounded-full shadow-lg border-2 border-slate-100 text-slate-600 hover:text-emerald-600 transition-all"
        title="Recenter Map to Your Location"
      >
        <Crosshair size={24} />
      </button>
    </div>
  );
};
