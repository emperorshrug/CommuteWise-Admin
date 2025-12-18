import { useEffect, useState, useRef } from "react";
import Map, {
  Marker,
  NavigationControl,
  MapRef,
  MapLayerMouseEvent,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Stop } from "../types";
import { MapPin } from "lucide-react";

interface MapAreaProps {
  stops: Stop[];
  onMapClick: (lat: number, lng: number) => void;
  tempMarker: { lat: number; lng: number } | null;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Color mapping based on your requirements
const getMarkerColor = (types: string[]) => {
  if (types.length > 1) return "#EAB308"; // Yellow (Mixed)
  if (types.includes("Bus")) return "#2563EB"; // Blue
  if (types.includes("Jeepney")) return "#7C3AED"; // Violet
  if (types.includes("E-Jeepney")) return "#C026D3"; // Magenta
  if (types.includes("Tricycle")) return "#16A34A"; // Green
  return "#64748B"; // Gray default
};

const getMarkerIcon = (types: string[]) => {
  if (types.includes("Tricycle") && types.length === 1) return "🛺";
  return "🚌";
};

export default function MapArea({
  stops,
  onMapClick,
  tempMarker,
}: MapAreaProps) {
  const mapRef = useRef<MapRef>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // 1. Get Current Location on Mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });

          // Fly to location
          mapRef.current?.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 2000,
          });
        },
        (error) => console.error("Error getting location:", error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleClick = (e: MapLayerMouseEvent) => {
    onMapClick(e.lngLat.lat, e.lngLat.lng);
  };

  return (
    <div className="grow h-full relative bg-gray-100">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 121.0,
          latitude: 14.6,
          zoom: 12,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12" // Or use a lighter style like 'light-v11' for modern look
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={handleClick}
      >
        <NavigationControl position="top-right" />

        {/* 2. Current Location Marker (Pulsing Dot) */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
            <div className="relative">
              <span className="flex h-4 w-4 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white shadow-md"></span>
              </span>
            </div>
          </Marker>
        )}

        {/* 3. Render Stops */}
        {stops.map((stop) => {
          const color = getMarkerColor(stop.vehicleTypes);
          const icon = getMarkerIcon(stop.vehicleTypes);

          return (
            <Marker
              key={stop.id}
              longitude={stop.lng}
              latitude={stop.lat}
              anchor="bottom"
            >
              <div className="group relative flex flex-col items-center cursor-pointer hover:z-50">
                {/* Tooltip */}
                <div className="absolute bottom-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap pointer-events-none z-50">
                  <div className="font-bold">{stop.name}</div>
                  <div className="text-[10px] text-gray-300 font-normal">
                    {stop.barangay}
                  </div>
                </div>

                {/* Pin Icon */}
                <div className="relative" style={{ color }}>
                  <MapPin
                    size={stop.type === "terminal" ? 40 : 30}
                    fill={stop.type === "terminal" ? "currentColor" : "white"}
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="drop-shadow-md"
                  />
                  {/* Emoji Overlay */}
                  <span className="absolute top-[3px] left-1/2 -translate-x-1/2 text-[10px]">
                    {icon}
                  </span>
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Temp Marker */}
        {tempMarker && (
          <Marker
            longitude={tempMarker.lng}
            latitude={tempMarker.lat}
            anchor="bottom"
          >
            <MapPin
              className="text-emerald-500 animate-bounce drop-shadow-lg"
              size={40}
              fill="white"
            />
          </Marker>
        )}
      </Map>
    </div>
  );
}
