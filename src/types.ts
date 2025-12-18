//
export interface Stop {
  id: string;
  name: string;
  type: "terminal" | "stop"; // CAPS LOCK COMMENT: NORMALIZED TO LOWERCASE TO MATCH DB/ENUMS OFTEN USED
  lat: number;
  lng: number;
  vehicleTypes: string[];
  barangay: string;
}
