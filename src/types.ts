export interface Stop {
  id: string;
  name: string;
  type: "terminal" | "stop";
  lat: number;
  lng: number;
  vehicleTypes: string[];
  barangay: string; // New Field
}
