// src/components/sidebar/RouteMetaForm.tsx

/**
 * CONTEXT: COMMUTEWISE ROUTE META FORM
 * ====================================
 * THIS COMPONENT RENDERS:
 * - ROUTE NAME
 * - TRANSPORT MODE
 * - FARE (PHP) + FREE RIDE TOGGLE
 * - DISCOUNTED FARE (PHP, AUTO 20% OFF BUT OVERRIDABLE)
 * - STRICT STOPS TOGGLE
 *
 * IT IS PURELY PRESENTATIONAL AND DELEGATES STATE UP VIA setField.
 */

import type { RouteBuilderField } from "../../store/useRouteBuilderStore";

interface RouteMetaFormProps {
  routeName: string;
  transportMode: string;
  fare: number;
  discountedFare: number;
  isFree: boolean;
  isStrict: boolean;

  // CAPS LOCK COMMENT: USE RouteBuilderField SO TYPES MATCH ZUSTAND STORE EXACTLY
  setField: (
    field: RouteBuilderField,
    value: string | number | boolean
  ) => void;
}

export default function RouteMetaForm({
  routeName,
  transportMode,
  fare,
  discountedFare,
  isFree,
  isStrict,
  setField,
}: RouteMetaFormProps) {
  return (
    <div className="space-y-3">
      {/* ROUTE NAME */}
      <div>
        <label
          htmlFor="route-name"
          className="text-xs font-bold text-slate-500 uppercase"
        >
          Route Name
        </label>
        <input
          id="route-name"
          type="text"
          value={routeName}
          onChange={(e) => setField("routeName", e.target.value)}
          placeholder="e.g. SM North - Fairview"
          className="w-full mt-1 p-2 border rounded-lg text-sm font-semibold"
        />
      </div>

      {/* MODE + FARE */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="transport-mode"
            className="text-xs font-bold text-slate-500 uppercase"
          >
            Mode
          </label>
          <select
            id="transport-mode"
            value={transportMode}
            onChange={(e) => setField("transportMode", e.target.value)}
            className="w-full mt-1 p-2 border rounded-lg text-sm bg-white"
          >
            <option>Jeepney</option>
            <option>Bus</option>
            <option>E-Jeepney</option>
            <option>Tricycle</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="fare-input"
            className="text-xs font-bold text-slate-500 uppercase"
          >
            Fare (PHP)
          </label>
          <input
            id="fare-input"
            type="number"
            min={0}
            value={isFree ? 0 : fare}
            disabled={isFree}
            onChange={(e) => {
              const raw = Number(e.target.value);
              const safe = Number.isFinite(raw) ? Math.max(0, raw) : 0;
              setField("fare", safe);
            }}
            className="w-full mt-1 p-2 border rounded-lg text-sm disabled:opacity-50"
          />
        </div>
      </div>

      {/* DISCOUNTED FARE */}
      <div>
        <label
          htmlFor="discounted-fare-input"
          className="text-xs font-bold text-slate-500 uppercase"
        >
          Discounted Fare (PHP)
        </label>
        <input
          id="discounted-fare-input"
          type="number"
          min={0}
          value={isFree ? 0 : discountedFare}
          disabled={isFree}
          onChange={(e) => {
            // CAPS LOCK COMMENT: PASS RAW STRING SO STORE CAN HANDLE EMPTY -> AUTO BEHAVIOR
            setField("discountedFare", e.target.value);
          }}
          className="w-full mt-1 p-2 border rounded-lg text-sm disabled:opacity-50"
        />
        <p className="mt-1 text-[11px] text-slate-400">
          Auto 20% off base fare by default. Override manually if operators use
          a different discounted fare.
        </p>
      </div>

      {/* FLAGS */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={isFree}
            onChange={(e) => {
              const checked = e.target.checked;
              setField("isFree", checked);
              if (checked) setField("fare", 0);
            }}
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          Free Ride
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={isStrict}
            onChange={(e) => setField("isStrict", e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          Strict Stops
        </label>
      </div>
    </div>
  );
}
