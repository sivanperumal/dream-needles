"use client";

import { CheckCircle2, MapPin, Truck, XCircle } from "lucide-react";
import { useState } from "react";

type Result = {
  valid: boolean;
  district?: string;
  state?: string;
  reason?: string;
  eta: string;
};

/** Delivery & courier check (Figma PDP): validates a pincode and shows the ETA. */
export function PincodeCheck() {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      setResult({ valid: false, reason: "invalid", eta: "" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/pincode/${pincode}`);
      setResult((await res.json()) as Result);
    } catch {
      setResult({ valid: false, reason: "unavailable", eta: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Truck className="size-4" aria-hidden="true" /> Delivery &amp; Courier
        Check
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void check();
        }}
      >
        <label className="flex flex-1 items-center gap-2 rounded-lg bg-[#f0f3ff] px-3">
          <MapPin className="size-4 text-gray-400" aria-hidden="true" />
          <span className="sr-only">Delivery pincode</span>
          <input
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 6-digit Pincode (e.g. 560001)"
            className="w-full bg-transparent py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {loading ? "Checking…" : "Verify"}
        </button>
      </form>
      <p className="mt-3 flex items-start gap-1.5 text-xs" aria-live="polite">
        {!result ? (
          <span className="flex items-center gap-1.5 text-gray-600">
            <CheckCircle2
              className="size-3.5 text-emerald-600"
              aria-hidden="true"
            />
            Standard dispatch: packed within 24 hours on working days.
          </span>
        ) : result.valid ? (
          <span className="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Delivers to {result.district}, {result.state}. {result.eta}.
          </span>
        ) : result.reason === "unavailable" ? (
          <span className="text-gray-600">
            We deliver across India.{" "}
            {result.eta || "Delivered in 3–5 business days"}.
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-rose-600">
            <XCircle className="size-3.5" aria-hidden="true" />
            {result.reason === "invalid"
              ? "Please enter a valid 6-digit pincode."
              : "We couldn't find that pincode. Please check it."}
          </span>
        )}
      </p>
    </div>
  );
}
