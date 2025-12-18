import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapMarker } from "../hooks/useRouteManager";

// --- PROPS INTERFACE: STRICTLY TYPED FOR DATA FLOW ---
interface RouteManagerMapProps {
  markers: MapMarker[];
  onMapClick: (lat: number, lng: number) => void;
  onMarkerClick: (marker: MapMarker) => void;
}

// --- SET MAPBOX ACCESS TOKEN ---
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export const RouteManagerMap: React.FC<RouteManagerMapProps> = ({
  markers,
  onMapClick,
  onMarkerClick,
}) => {
  // --- REF: HOLDS THE MAP DOM ELEMENT ---
  const mapContainer = useRef<HTMLDivElement>(null);

  // --- REF: HOLDS THE MAPBOX INSTANCE ---
  const map = useRef<mapboxgl.Map | null>(null);

  // --- REF: HOLDS REFERENCES TO MARKER INSTANCES ON THE MAP TO CLEAN UP LATER ---
  const markerRefs = useRef<{ [key: string]: mapboxgl.Marker }>({});

  // --- EFFECT: INITIALIZE MAP ON MOUNT ONLY ---
  useEffect(() => {
    if (map.current) return; // PREVENT RE-INITIALIZATION
    if (!mapContainer.current) return;

    // INITIALIZE MAP
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12", // USE YOUR PREFERRED STYLE
      center: [121.0423, 14.676], // CENTERED ON TANDANG SORA / QCU AREA
      zoom: 13,
    });

    // --- EVENT LISTENER: MAP CLICK ---
    map.current.on("click", (e) => {
      // TRIGGER PARENT HANDLER WITH COORDINATES
      onMapClick(e.lngLat.lat, e.lngLat.lng);
    });
  }, []); // EMPTY DEPENDENCY ARRAY = RUN ONCE

  // --- EFFECT: SYNC MARKERS WHEN 'markers' PROP CHANGES ---
  useEffect(() => {
    if (!map.current) return;

    // 1. ITERATE OVER EXISTING MARKERS AND REMOVE THEM FROM MAP
    //    THIS ENSURES WE DON'T HAVE DUPLICATES OR STALE MARKERS
    Object.values(markerRefs.current).forEach((marker) => marker.remove());
    markerRefs.current = {}; // RESET REF STORE

    // 2. ITERATE OVER NEW DATA AND ADD MARKERS TO MAP
    markers.forEach((marker) => {
      // DETERMINE COLOR BASED ON TYPE (VISUAL DISTINCTION)
      const color = marker.type === "TERMINAL" ? "#FF0000" : "#3FB1CE";

      // CREATE DOM ELEMENT FOR CUSTOM MARKER (OPTIONAL, BUT GOOD FOR STYLING)
      const el = document.createElement("div");
      el.className = "marker";
      el.style.backgroundColor = color;
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "50%";
      el.style.cursor = "pointer";

      // INITIALIZE MAPBOX MARKER
      const newMapboxMarker = new mapboxgl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map.current!);

      // ADD CLICK LISTENER TO ELEMENT
      el.addEventListener("click", (e) => {
        e.stopPropagation(); // PREVENT MAP CLICK FROM FIRING
        onMarkerClick(marker); // TELL PARENT A MARKER WAS CLICKED
      });

      // STORE REF FOR FUTURE CLEANUP
      markerRefs.current[marker.id] = newMapboxMarker;
    });
  }, [markers, onMarkerClick]); // RE-RUN WHENEVER MARKERS ARRAY CHANGES

  // --- RENDER: JUST A CONTAINER DIV ---
  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    />
  );
};
