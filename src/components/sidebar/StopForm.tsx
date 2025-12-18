import React, { useState } from "react";
import { CheckSquare } from "lucide-react";

interface StopFormProps {
  location: { lat: number; lng: number };
  onSave: (
    name: string,
    type: "terminal" | "stop",
    vehicleTypes: string[],
    barangay: string
  ) => void;
  onCancel: () => void;
  barangays: string[];
  vehicleOptions: string[];
}

export default function StopForm({
  location,
  onSave,
  onCancel,
  barangays,
  vehicleOptions,
}: StopFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"terminal" | "stop">("stop");
  const [barangay, setBarangay] = useState(barangays[0]);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);

  const handleCheckboxChange = (vehicle: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(vehicle)
        ? prev.filter((v) => v !== vehicle)
        : [...prev, vehicle]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    // For terminal, use selection. For stop, usually auto-assigned or empty,
    // but here we pass selection if type is terminal.
    const finalVehicles = type === "terminal" ? selectedVehicles : [];
    onSave(name, type, finalVehicles, barangay);
  };

  return (
    <div className="p-4 m-4 bg-white rounded-xl shadow-sm border border-emerald-100">
      <h2 className="font-bold text-emerald-800 mb-1">Add New Point</h2>
      <div className="text-xs text-gray-400 mb-4 font-mono">
        {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Name (e.g., UP Jeep Terminal)"
          className="p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <select
            className="p-2.5 border border-gray-300 rounded-lg text-sm outline-none"
            value={type}
            onChange={(e) => setType(e.target.value as "terminal" | "stop")}
            title="Select Stop Type"
          >
            <option value="stop">Stop Point</option>
            <option value="terminal">Terminal</option>
          </select>

          <select
            className="p-2.5 border border-gray-300 rounded-lg text-sm outline-none"
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
            title="Select Barangay"
          >
            {barangays.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {type === "terminal" && (
          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
            <p className="text-xs font-bold text-emerald-700 mb-2 uppercase">
              Vehicles Served
            </p>
            <div className="grid grid-cols-2 gap-2">
              {vehicleOptions.map((v) => (
                <label
                  key={v}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <div
                    onClick={() => handleCheckboxChange(v)}
                    className={`w-4 h-4 flex items-center justify-center rounded border ${
                      selectedVehicles.includes(v)
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-gray-400 bg-white"
                    }`}
                  >
                    <CheckSquare size={12} />
                  </div>
                  <span className="text-gray-700">{v}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition shadow-sm"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-white text-gray-600 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
