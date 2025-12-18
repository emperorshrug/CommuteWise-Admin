import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";
import { Stop } from "../types";

// CAPS LOCK COMMENT: ENSURE DB TYPES ARE CORRECT
type StopInsert = Database["public"]["Tables"]["stops"]["Insert"];

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const useRouteManager = () => {
  const [markers, setMarkers] = useState<Stop[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<Stop | null>(null);

  // CAPS LOCK COMMENT: NEW STATE FOR 'GHOST' MARKER (VISUAL FEEDBACK ON CLICK)
  const [tempMarker, setTempMarker] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

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
        const formattedData: Stop[] = data
          .map((item) => {
            const lat = Number(item.latitude);
            const lng = Number(item.longitude);

            if (isNaN(lat) || isNaN(lng)) return null;

            return {
              id: item.id,
              lat: lat,
              lng: lng,
              type: (item.type || "stop").toLowerCase() as "terminal" | "stop",
              name: item.name || "Unnamed",
              barangay: item.barangay || "",
              vehicleTypes: item.vehicle_types || [],
            };
          })
          .filter((item): item is Stop => item !== null);

        setMarkers(formattedData);
      }
    } catch (error) {
      console.error("ERROR FETCHING MARKERS:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (isNaN(lat) || isNaN(lng)) return;

    // 1. SET TEMP MARKER FOR VISUAL FEEDBACK
    setTempMarker({ lat, lng });

    // 2. OPEN FORM WITH NEW DATA
    const newMarker: Stop = {
      id: crypto.randomUUID(),
      lat,
      lng,
      type: "stop",
      name: "",
      barangay: "",
      vehicleTypes: [],
    };
    setSelectedMarker(newMarker);
  }, []);

  const saveMarker = async (marker: Stop) => {
    try {
      setIsLoading(true);

      const payload: StopInsert = {
        id: marker.id,
        latitude: marker.lat,
        longitude: marker.lng,
        type: marker.type,
        name: marker.name,
        barangay: marker.barangay,
        vehicle_types: marker.vehicleTypes,
      };

      const { error } = await supabase.from("stops").upsert(payload);

      if (error) throw error;

      await fetchMarkers();
      setSelectedMarker(null);
      setTempMarker(null); // CLEAR GHOST MARKER ON SUCCESS
    } catch (error) {
      console.error("ERROR SAVING MARKER:", error);
      alert("Failed to save marker. Check console for details.");
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
    tempMarker, // EXPORT THIS
    isLoading,
    setSelectedMarker,
    handleMapClick,
    saveMarker,
    deleteMarker,
  };
};
