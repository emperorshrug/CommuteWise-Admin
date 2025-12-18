import { useState, useRef, useCallback } from "react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const useGeocoding = () => {
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // THROTTLE CONTROL: PREVENTS SPAMMING THE API
  const lastCallTime = useRef<number>(0);

  const getBarangay = useCallback(
    async (lat: number, lng: number): Promise<string | null> => {
      const now = Date.now();
      // 2 SECOND THROTTLE GUARD
      if (now - lastCallTime.current < 2000) {
        console.warn("Geocoding throttled. Please wait.");
        return null;
      }

      lastCallTime.current = now;
      setIsLoadingAddress(true);

      try {
        // MAPBOX REVERSE GEOCODING API
        // TYPES=LOCALITY,NEIGHBORHOOD FILTERS FOR BARANGAY-LEVEL RESULTS
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=neighborhood,locality&access_token=${MAPBOX_TOKEN}`
        );

        const data = await response.json();

        if (data.features && data.features.length > 0) {
          // RETURN THE FIRST RELEVANT PLACE NAME
          return data.features[0].text;
        }
        return null;
      } catch (error) {
        console.error("Error fetching barangay:", error);
        return null;
      } finally {
        setIsLoadingAddress(false);
      }
    },
    []
  );

  return { getBarangay, isLoadingAddress };
};
