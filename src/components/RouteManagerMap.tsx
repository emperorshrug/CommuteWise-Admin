import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
// CAPS LOCK COMMENT: NOW IMPORTING FROM CORRECT HOOKS PATH
import { MapMarker } from "../hooks/useRouteManager";

interface RouteManagerMapProps {
  markers: MapMarker[];
  onMapClick: (lat: number, lng: number) => void;
  onMarkerClick: (marker: MapMarker) => void;
}

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export const RouteManagerMap: React.FC<RouteManagerMapProps> = ({
  markers,
  onMapClick,
  onMarkerClick,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<{ [key: string]: mapboxgl.Marker }>({});

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
  }, []);

  useEffect(() => {
    if (!map.current) return;

    Object.values(markerRefs.current).forEach((marker) => marker.remove());
    markerRefs.current = {};

    markers.forEach((marker) => {
      const color = marker.type === "TERMINAL" ? "#FF0000" : "#3FB1CE";
      const el = document.createElement("div");

      // CAPS LOCK COMMENT: USING TAILWIND UTILITY CLASSES WHERE POSSIBLE,
      // BUT DYNAMIC COLORS STILL NEED INLINE OR CUSTOM CLASSES.
      el.className = "marker rounded-full cursor-pointer w-5 h-5";
      el.style.backgroundColor = color; // DYNAMIC COLOR IS OKAY INLINE

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

  return (
    // CAPS LOCK COMMENT: REPLACED INLINE STYLES WITH TAILWIND CLASSES
    <div ref={mapContainer} className="w-full h-full absolute top-0 left-0" />
  );
};
