// src/hooks/map/useUserLocation.ts

/**
 * CONTEXT: COMMUTEWISE USER LOCATION HOOK
 * =======================================
 * PREVIOUSLY THIS HOOK REQUESTED LOCATION ON MOUNT, WHICH TRIGGERS
 * BROWSER WARNINGS ABOUT CALLING GEOLOCATION WITHOUT A USER GESTURE.
 *
 * UPDATED BEHAVIOR:
 * - DOES NOT AUTOMATICALLY REQUEST LOCATION.
 * - EXPOSES A HELPER FUNCTION YOU CAN CALL FROM A BUTTON (E.G. "RECENTER").
 */

import { useCallback } from "react";

export function useUserLocation(map: mapboxgl.Map | null) {
  const recenterToUser = useCallback(() => {
    if (!map) return;
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 15,
        });
      },
      (err) => {
        console.warn("COMMUTEWISE: GEOLOCATION ERROR:", err);
      }
    );
  }, [map]);

  return { recenterToUser };
}
