// src/components/sidebar/RouteEditForm.tsx

import { useState } from "react";
import { X, Save } from "lucide-react";
import { useRouteNetworkStore } from "../../store/useRouteNetworkStore";
import { updateRouteMeta, type RouteRow } from "../../services/routeService";

// CAPS LOCK COMMENT: SHARED DISCOUNT HELPER (20% OFF WITH 2 DECIMAL PLACES)
const calculateDiscount = (fare: number): number => {
  if (!Number.isFinite(fare) || fare <= 0) return 0;
  const discounted = fare * 0.8;
  return Math.round(discounted * 100) / 100;
};

interface RouteEditFormProps {
  route: RouteRow;
  onClose: () => void;
}

/**
 * CONTEXT: COMMUTEWISE ROUTE EDIT FORM
 * ====================================
 * ALLOWS EDITING:
 * - ROUTE NAME
 * - VEHICLE TYPE
 * - FARE + DISCOUNTED FARE
 * - STRICT FLAG
 *
 * IT DOES NOT EDIT GEOMETRY OR STOPS (THEY REMAIN AS ORIGINALLY BUILT).
 */
export default function RouteEditForm({ route, onClose }: RouteEditFormProps) {
  const reloadNetwork = useRouteNetworkStore((state) => state.reload);

  const [name, setName] = useState(route.name);

  // CAPS LOCK COMMENT: NORMALIZE VEHICLE TYPE TO HUMAN-FRIENDLY LABEL (e.g. "jeepney" -> "Jeepney")
  const [vehicleType, setVehicleType] = useState(
    route.vehicle_type
      ? route.vehicle_type
          .split("-")
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join("-")
      : "Jeepney"
  );

  const [fare, setFare] = useState<number>(route.fare_amount ?? 0);

  const initialDisc =
    route.discounted_fare_amount != null
      ? route.discounted_fare_amount
      : calculateDiscount(route.fare_amount ?? 0);

  const [discountedFare, setDiscountedFare] = useState<number>(initialDisc);

  // CAPS LOCK COMMENT: IF ORIGINAL ROW HAD NO DISCOUNTED_FARE, WE START IN AUTO MODE (20% OFF)
  const [isDiscountAuto, setIsDiscountAuto] = useState(
    route.discounted_fare_amount == null
  );

  const [isStrict, setIsStrict] = useState<boolean>(route.is_strict ?? false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const safeFare = Number.isFinite(fare) ? Math.max(0, fare) : 0;
    const safeDisc = Number.isFinite(discountedFare)
      ? Math.max(0, discountedFare)
      : 0;

    const trimmedName = name.trim() || route.name;

    try {
      setIsSaving(true);

      await updateRouteMeta({
        id: route.id,
        name: trimmedName,
        vehicleType,
        fareAmount: safeFare,
        discountedFareAmount: safeDisc,
        isStrict,
      });

      // CAPS LOCK COMMENT: REFRESH ROUTE NETWORK SO SIDEBAR + MAP REFLECT LATEST DATA
      await reloadNetwork();

      onClose();
    } catch (error) {
      console.error("COMMUTEWISE: FAILED TO UPDATE ROUTE:", error);
      alert("Failed to update route. Please check the console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* HEADER */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between shadow-sm">
        <h3 className="font-bold text-lg text-slate-800">Edit Route</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
          aria-label="Close Edit Route"
        >
          <X size={20} />
        </button>
      </div>

      {/* BODY */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 p-4 space-y-4 overflow-y-auto"
      >
        {/* NAME */}
        <div>
          <label
            htmlFor="route-name-edit"
            className="text-xs font-bold text-slate-500 uppercase"
          >
            Route Name
          </label>
          <input
            id="route-name-edit"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 p-2 border rounded-lg text-sm font-semibold"
          />
        </div>

        {/* VEHICLE TYPE */}
        <div>
          <label
            htmlFor="vehicle-type-edit"
            className="text-xs font-bold text-slate-500 uppercase"
          >
            Vehicle Type
          </label>
          <select
            id="vehicle-type-edit"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="w-full mt-1 p-2 border rounded-lg text-sm bg-white"
          >
            <option>Jeepney</option>
            <option>Bus</option>
            <option>E-Jeepney</option>
            <option>Tricycle</option>
          </select>
        </div>

        {/* FARE + DISCOUNTED FARE */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="fare-edit"
              className="text-xs font-bold text-slate-500 uppercase"
            >
              Fare (PHP)
            </label>
            <input
              id="fare-edit"
              type="number"
              min={0}
              value={fare}
              onChange={(e) => {
                const raw = Number(e.target.value);
                const safe = Number.isFinite(raw) ? Math.max(0, raw) : 0;
                setFare(safe);
                if (isDiscountAuto) {
                  setDiscountedFare(calculateDiscount(safe));
                }
              }}
              className="w-full mt-1 p-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="discounted-fare-edit"
              className="text-xs font-bold text-slate-500 uppercase"
            >
              Discounted Fare (PHP)
            </label>
            <input
              id="discounted-fare-edit"
              type="number"
              min={0}
              value={discountedFare}
              onChange={(e) => {
                const rawStr = e.target.value;
                if (rawStr.trim() === "") {
                  // CAPS LOCK COMMENT: EMPTY INPUT -> RETURN TO AUTO 20% MODE
                  setIsDiscountAuto(true);
                  setDiscountedFare(calculateDiscount(fare));
                  return;
                }
                const raw = Number(rawStr);
                if (!Number.isFinite(raw) || raw < 0) return;
                setIsDiscountAuto(false);
                setDiscountedFare(raw);
              }}
              className="w-full mt-1 p-2 border rounded-lg text-sm"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Leave blank to auto-apply 20% discount from base fare. Enter a
              value to override.
            </p>
          </div>
        </div>

        {/* STRICT FLAG */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isStrict}
              onChange={(e) => setIsStrict(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            Strict Stops (no free-boarding between marked stops)
          </label>
        </div>

        {/* FOOTER BUTTON INSIDE FORM FOR ALIGNMENT */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-emerald-600 disabled:bg-emerald-400 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {isSaving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
