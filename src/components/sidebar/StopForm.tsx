import React, { useState } from "react";
import { X, MapPin } from "lucide-react"; // Import icons
import { Stop } from "../../types";
import { useGeocoding } from "../../hooks/useGeocoding";

interface StopFormProps {
  location: Stop; // Or { lat: number, lng: number } depending on usage
  barangays: string[];
  vehicleOptions: string[];
  onSave: (
    name: string,
    type: "terminal" | "stop",
    vehicleTypes: string[],
    barangay: string
  ) => void;
  onCancel: () => void;
}

export default function StopForm({
  location,
  barangays,
  vehicleOptions,
  onSave,
  onCancel,
}: StopFormProps) {
  const [name, setName] = useState(location.name || "");
  const [type, setType] = useState<"terminal" | "stop">(
    location.type || "stop"
  );
  const [barangay, setBarangay] = useState(location.barangay || "");
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(
    location.vehicleTypes || []
  );

  // USE OUR NEW GEOCODING HOOK
  const { getBarangay, isLoadingAddress } = useGeocoding();

  const handleGeocode = async () => {
    const foundBarangay = await getBarangay(location.lat, location.lng);
    if (foundBarangay) {
      setBarangay(foundBarangay);
    } else {
      alert("Could not determine barangay for this location.");
    }
  };

  const handleVehicleToggle = (v: string) => {
    setVehicleTypes((prev) =>
      prev.includes(v) ? prev.filter((item) => item !== v) : [...prev, v]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name, type, vehicleTypes, barangay);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg text-slate-800">
          {location.id ? "Edit Point" : "New Point"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600"
          title="Close Form"
        >
          <X size={20} />
        </button>
      </div>

      {/* NAME INPUT */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-emerald-500"
          placeholder="e.g. Tandang Sora Bayan"
          required
        />
      </div>

      {/* TYPE SELECT */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
          Type
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("stop")}
            className={`flex-1 py-2 text-sm rounded border ${
              type === "stop"
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            Regular Stop
          </button>
          <button
            type="button"
            onClick={() => setType("terminal")}
            className={`flex-1 py-2 text-sm rounded border ${
              type === "terminal"
                ? "bg-red-500 text-white border-red-500"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            Terminal
          </button>
        </div>
      </div>

      {/* BARANGAY + GEOCODE BUTTON */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
          Barangay
        </label>
        <div className="flex gap-2">
          <input
            list="barangay-list"
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
            className="flex-1 p-2 border border-slate-200 rounded text-sm focus:outline-emerald-500"
            placeholder="Select or Search..."
          />
          <button
            type="button"
            onClick={handleGeocode}
            disabled={isLoadingAddress}
            className="p-2 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 transition-colors disabled:opacity-50"
            title="Auto-detect Barangay"
          >
            <MapPin
              size={18}
              className={isLoadingAddress ? "animate-spin" : "text-emerald-600"}
            />
          </button>
        </div>
        <datalist id="barangay-list">
          {barangays.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
      </div>

      {/* HOLLOW CHECKBOXES FOR VEHICLES */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
          Vehicles
        </label>
        <div className="grid grid-cols-2 gap-2">
          {vehicleOptions.map((v) => {
            const isSelected = vehicleTypes.includes(v);
            return (
              <div
                key={v}
                onClick={() => handleVehicleToggle(v)}
                className={`cursor-pointer flex items-center gap-2 p-2 border rounded transition-all ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 hover:border-emerald-300"
                }`}
              >
                {/* CUSTOM HOLLOW CHECKBOX */}
                <div
                  className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-slate-400 bg-white"
                  }`}
                >
                  {isSelected && (
                    <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />
                  )}
                </div>
                <span
                  className={`text-sm ${
                    isSelected
                      ? "text-emerald-700 font-medium"
                      : "text-slate-600"
                  }`}
                >
                  {v}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2 flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-emerald-600 text-white py-2 rounded shadow hover:bg-emerald-700 font-medium"
        >
          Save Stop
        </button>
      </div>
    </form>
  );
}
