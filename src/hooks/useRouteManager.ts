import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase"; // CAPS LOCK COMMENT: NOW POINTS TO CORRECT FILE

// --- INITIALIZE SUPABASE CLIENT ---
// CAPS LOCK COMMENT: ENV ERRORS ARE FIXED BY VITE-ENV.D.TS
const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
);

export type MarkerType = "TERMINAL" | "STOP";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: MarkerType;
  name: string;
}

export const useRouteManager = () => {
  // --- STATE MANAGEMENT ---
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMarkers();
  }, []);

  const fetchMarkers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from("stops").select("*");

      if (error) throw error;

      if (data) {
        // CAPS LOCK COMMENT: MAPPING DB TYPES TO UI TYPES
        const formattedData: MapMarker[] = data.map((item: any) => ({
          id: item.id,
          lat: item.latitude,
          lng: item.longitude,
          type: item.type,
          name: item.name,
        }));
        setMarkers(formattedData);
      }
    } catch (error) {
      console.error("ERROR FETCHING MARKERS:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = useCallback((lat: number, lng: number) => {
    const newMarker: MapMarker = {
      id: crypto.randomUUID(),
      lat,
      lng,
      type: "STOP",
      name: "New Stop",
    };
    setMarkers((prev) => [...prev, newMarker]);
    setSelectedMarker(newMarker);
  }, []);

  const saveMarker = async (marker: MapMarker) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.from("stops").upsert({
        id: marker.id,
        latitude: marker.lat,
        longitude: marker.lng,
        type: marker.type,
        name: marker.name,
      });

      if (error) throw error;
      await fetchMarkers();
    } catch (error) {
      console.error("ERROR SAVING MARKER:", error);
      alert("Failed to save marker.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMarker = async (id: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.from("stops").delete().eq("id", id);
      if (error) throw error;
      setMarkers((prev) => prev.filter((m) => m.id !== id));
      setSelectedMarker(null);
    } catch (error) {
      console.error("ERROR DELETING MARKER:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    markers,
    selectedMarker,
    isLoading,
    setSelectedMarker,
    handleMapClick,
    saveMarker,
    deleteMarker,
  };
};
