import { create } from "zustand";
import { supabase } from "../lib/supabaseClient"; // NEW
import { Database } from "../types/supabase";
import { Stop } from "../types";

// CAPS LOCK COMMENT: SUPABASE INSERT TYPE FOR STOPS TABLE
type StopInsert = Database["public"]["Tables"]["stops"]["Insert"];
interface RouteState {
  // STATE
  markers: Stop[];
  selectedMarker: Stop | null;
  tempMarker: { lat: number; lng: number } | null;
  isLoading: boolean;

  // ACTIONS
  fetchMarkers: () => Promise<void>;
  handleMapClick: (lat: number, lng: number) => void;
  selectMarker: (marker: Stop | null) => void;
  saveMarker: (marker: Stop) => Promise<Stop | null>;
  deleteMarker: (id: string) => Promise<void>;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  markers: [],
  selectedMarker: null,
  tempMarker: null,
  isLoading: false,

  fetchMarkers: async () => {
    set({ isLoading: true });
    try {
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
              lat,
              lng,
              type: (item.type || "stop").toLowerCase() as "terminal" | "stop",
              name: item.name || "Unnamed",
              barangay: item.barangay || "",
              vehicleTypes: item.vehicle_types || [],
            };
          })
          .filter((item): item is Stop => item !== null);

        set({ markers: formattedData });
      }
    } catch (error) {
      console.error("ERROR FETCHING MARKERS:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  handleMapClick: (lat, lng) => {
    if (isNaN(lat) || isNaN(lng)) return;

    // CAPS LOCK COMMENT: ALWAYS SET GHOST MARKER FOR VISUAL FEEDBACK
    set({ tempMarker: { lat, lng } });

    const currentSelected = get().selectedMarker;

    // CAPS LOCK COMMENT: IF A MARKER IS ALREADY SELECTED, MOVE IT; OTHERWISE CREATE A NEW ONE
    if (currentSelected) {
      set({
        selectedMarker: {
          ...currentSelected,
          lat,
          lng,
          barangay: "", // RESET BARANGAY ON MOVE
        },
      });
    } else {
      set({
        selectedMarker: {
          id: crypto.randomUUID(),
          lat,
          lng,
          type: "stop",
          name: "",
          barangay: "",
          vehicleTypes: [],
        },
      });
    }
  },

  selectMarker: (marker) => {
    // CAPS LOCK COMMENT: CLEAR GHOST MARKER WHEN AN EXISTING MARKER IS SELECTED OR SELECTION CLEARED
    set({ selectedMarker: marker, tempMarker: null });
  },

  saveMarker: async (marker) => {
    set({ isLoading: true });
    try {
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

      // CAPS LOCK COMMENT: REFRESH MARKERS SO NEW/UPDATED STOP IS AVAILABLE FOR SEARCH + ROUTE BUILDER
      await get().fetchMarkers();

      // CAPS LOCK COMMENT: FIND THE JUST-SAVED STOP FROM THE REFRESHED MARKER LIST
      const saved = get().markers.find((m) => m.id === marker.id) ?? {
        ...marker,
      };

      set({ selectedMarker: null, tempMarker: null });
      return saved;
    } catch (error) {
      console.error("ERROR SAVING MARKER:", error);
      alert("Failed to save marker.");
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteMarker: async (id) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.from("stops").delete().eq("id", id);
      if (error) throw error;

      set((state) => ({
        markers: state.markers.filter((m) => m.id !== id),
        selectedMarker: null,
      }));
    } catch (error) {
      console.error("ERROR DELETING MARKER:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
