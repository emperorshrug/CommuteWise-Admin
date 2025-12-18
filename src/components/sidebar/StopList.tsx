import { useState } from "react";
import type { Stop } from "../../types";
import { Search, ChevronDown, ChevronRight, MapPin } from "lucide-react";

interface StopListProps {
  stops: Stop[];
  vehicleOptions: string[];
}

// Helper for colors
const getVehicleColor = (type: string) => {
  switch (type) {
    case "Bus":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Jeepney":
      return "bg-violet-100 text-violet-800 border-violet-200";
    case "E-Jeepney":
      return "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200";
    case "Tricycle":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function StopList({ stops, vehicleOptions }: StopListProps) {
  const [activeTab, setActiveTab] = useState("Bus");
  const [searchText, setSearchText] = useState("");
  const [expandedBarangays, setExpandedBarangays] = useState<string[]>([]);

  const toggleBarangay = (bgy: string) => {
    setExpandedBarangays((prev) =>
      prev.includes(bgy) ? prev.filter((b) => b !== bgy) : [...prev, bgy]
    );
  };

  // Filter Logic
  const filteredStops = stops.filter((stop) => {
    const matchesSearch = stop.name
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesTab = stop.vehicleTypes.includes(activeTab);
    return matchesSearch && matchesTab;
  });

  // Group Logic
  const groupedStops = filteredStops.reduce((acc, stop) => {
    const bgy = stop.barangay || "Unassigned";
    if (!acc[bgy]) acc[bgy] = [];
    acc[bgy].push(stop);
    return acc;
  }, {} as Record<string, Stop[]>);

  return (
    <div className="flex flex-col h-full">
      {/* TABS */}
      <div className="flex bg-white border-b border-gray-200">
        {vehicleOptions.map((v) => (
          <button
            key={v}
            onClick={() => setActiveTab(v)}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === v
                ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {/* SEARCH */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab} stops...`}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
          />
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {Object.keys(groupedStops).length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              No {activeTab} stops found.
            </div>
          )}

          {Object.entries(groupedStops).map(([bgy, bgyStops]) => (
            <div
              key={bgy}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleBarangay(bgy)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition"
              >
                <span className="text-sm font-bold text-gray-700">{bgy}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    {bgyStops.length}
                  </span>
                  {expandedBarangays.includes(bgy) ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </div>
              </button>

              {expandedBarangays.includes(bgy) && (
                <div className="p-2 space-y-2">
                  {bgyStops.map((stop) => (
                    <div
                      key={stop.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-emerald-50 transition border border-transparent hover:border-emerald-100 group"
                    >
                      <MapPin
                        className={
                          stop.type === "terminal"
                            ? "text-emerald-600"
                            : "text-gray-400"
                        }
                        size={18}
                        fill={
                          stop.type === "terminal" ? "currentColor" : "none"
                        }
                      />
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">
                          {stop.name}
                        </div>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {stop.vehicleTypes.map((v) => (
                            <span
                              key={v}
                              className={`text-[10px] px-1.5 py-0.5 rounded border ${getVehicleColor(
                                v
                              )}`}
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
