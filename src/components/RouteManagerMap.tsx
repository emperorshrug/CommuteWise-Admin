import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Stop } from "../types";

interface RouteManagerMapProps {
  markers: Stop[];
  tempMarker: { lat: number; lng: number } | null; // NEW PROP
  onMapClick: (lat: number, lng: number) => void;
  onMarkerClick: (marker: Stop) => void;
}

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export const RouteManagerMap: React.FC<RouteManagerMapProps> = ({
  markers,
  tempMarker,
  onMapClick,
  onMarkerClick,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const tempMarkerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [121.0423, 14.676],
      zoom: 13,
    });

    map.current.on("click", (e) => {
      onMapClick(e.lngLat.lat, e.lngLat.lng);
    });
  }, [onMapClick]);

  // --- RENDER SAVED MARKERS ---
  useEffect(() => {
    if (!map.current) return;

    Object.values(markerRefs.current).forEach((marker) => marker.remove());
    markerRefs.current = {};

    markers.forEach((marker) => {
      if (typeof marker.lat !== "number" || typeof marker.lng !== "number")
        return;

      const color = marker.type === "terminal" ? "#ef4444" : "#0ea5e9"; // Tailwind Red/Blue

      const el = document.createElement("div");
      el.className =
        "w-6 h-6 rounded-full cursor-pointer border-2 border-white shadow-md transition-transform hover:scale-110";
      el.style.backgroundColor = color;

      const newMapboxMarker = new mapboxgl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map.current!);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onMarkerClick(marker);
      });

      markerRefs.current[marker.id] = newMapboxMarker;
    });
  }, [markers, onMarkerClick]);

  // --- RENDER TEMP MARKER (THE ONE YOU JUST CLICKED) ---
  useEffect(() => {
    if (!map.current) return;

    // REMOVE EXISTING TEMP MARKER
    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }

    // ADD NEW TEMP MARKER IF EXISTS
    if (tempMarker) {
      const el = document.createElement("div");
      // HOLLOW/GHOST STYLE FOR TEMP MARKER
      el.className =
        "w-6 h-6 rounded-full border-2 border-emerald-500 bg-emerald-500/30 animate-pulse";

      tempMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([tempMarker.lng, tempMarker.lat])
        .addTo(map.current!);
    }
  }, [tempMarker]);

  return <div ref={mapContainer} className="w-full h-full absolute inset-0" />;
};
