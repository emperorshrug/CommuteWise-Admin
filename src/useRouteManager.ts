import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js"; // OR IMPORT YOUR EXISTING SUPABASE CLIENT
import { Database } from "../types/supabase"; // ASSUMING YOU HAVE GENERATED TYPES

// --- INITIALIZE SUPABASE CLIENT (IF NOT ALREADY GLOBAL) ---
const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

// --- DEFINE TYPES LOCALLY OR IMPORT THEM ---
export type MarkerType = "TERMINAL" | "STOP";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: MarkerType;
  name: string;
}

export const useRouteManager = () => {
  // --- STATE: HOLDS THE LIST OF ALL MARKERS (STOPS/TERMINALS) ---
  const [markers, setMarkers] = useState<MapMarker[]>([]);

  // --- STATE: HOLDS THE CURRENTLY SELECTED MARKER FOR EDITING ---
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  // --- STATE: LOADING INDICATOR FOR ASYNC OPERATIONS ---
  const [isLoading, setIsLoading] = useState(false);

  // --- EFFECT: FETCH INITIAL DATA ON MOUNT ---
  useEffect(() => {
    fetchMarkers();
  }, []);

  // --- FUNCTION: FETCH ALL MARKERS FROM SUPABASE ---
  const fetchMarkers = async () => {
    try {
      setIsLoading(true);
      // SELECT ALL COLUMNS FROM THE 'stops' TABLE (ADJUST TABLE NAME AS NEEDED)
      const { data, error } = await supabase.from("stops").select("*");

      if (error) throw error;

      if (data) {
        // MAP DB RESPONSE TO OUR FRONTEND STATE SHAPE
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

  // --- FUNCTION: ADD A NEW TEMPORARY MARKER (CALLED ON MAP CLICK) ---
  const handleMapClick = useCallback((lat: number, lng: number) => {
    // CREATE A NEW 'DRAFT' MARKER
    const newMarker: MapMarker = {
      id: crypto.randomUUID(), // GENERATE TEMP ID
      lat,
      lng,
      type: "STOP", // DEFAULT TYPE
      name: "New Stop",
    };

    // ADD TO STATE IMMEDIATELY (OPTIMISTIC UPDATE)
    setMarkers((prev) => [...prev, newMarker]);
    setSelectedMarker(newMarker);
  }, []);

  // --- FUNCTION: SAVE OR UPDATE MARKER IN SUPABASE ---
  const saveMarker = async (marker: MapMarker) => {
    try {
      setIsLoading(true);

      // UPSERT: UPDATE IF EXISTS, INSERT IF NEW
      const { error } = await supabase.from("stops").upsert({
        id: marker.id,
        latitude: marker.lat,
        longitude: marker.lng,
        type: marker.type,
        name: marker.name,
      });

      if (error) throw error;

      // REFRESH DATA TO ENSURE SYNC
      await fetchMarkers();
    } catch (error) {
      console.error("ERROR SAVING MARKER:", error);
      alert("Failed to save marker.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNCTION: DELETE A MARKER ---
  const deleteMarker = async (id: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.from("stops").delete().eq("id", id);
      if (error) throw error;

      // REMOVE FROM LOCAL STATE
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
