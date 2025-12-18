import SidebarHeader from "./sidebar/SidebarHeader";
import StopForm from "./sidebar/StopForm";
import StopList from "./sidebar/StopList";
import type { Stop } from "../types";

interface SidebarProps {
  stops: Stop[];
  newStopLocation: { lat: number; lng: number } | null;
  onSaveStop: (
    name: string,
    type: "terminal" | "stop",
    vehicleTypes: string[],
    barangay: string
  ) => void;
  onCancel: () => void;
}

const VEHICLE_OPTIONS = ["Bus", "Jeepney", "E-Jeepney", "Tricycle"];
const BARANGAYS = [
  "Tandang Sora",
  "Pasong Tamo",
  "Culiat",
  "Sauyo",
  "Sangandaan",
  "Bahay Toro",
];

export default function RouteManagerSidebar({
  stops,
  newStopLocation,
  onSaveStop,
  onCancel,
}: SidebarProps) {
  return (
    <div className="w-96 h-full bg-white shadow-xl z-10 flex flex-col border-r border-emerald-100 font-sans">
      {/* 1. Header is static */}
      <SidebarHeader />

      {/* 2. Content is conditional */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {newStopLocation ? (
          <StopForm
            // The 'key' trick for resetting state still works here
            key={`${newStopLocation.lat}-${newStopLocation.lng}`}
            location={newStopLocation}
            barangays={BARANGAYS}
            vehicleOptions={VEHICLE_OPTIONS}
            onSave={onSaveStop}
            onCancel={onCancel}
          />
        ) : (
          <StopList stops={stops} vehicleOptions={VEHICLE_OPTIONS} />
        )}
      </div>
    </div>
  );
}
