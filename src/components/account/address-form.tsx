"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { type FormState, saveAddress } from "@/lib/actions/account";
import { INDIAN_STATES } from "@/lib/india";

export type AddressValues = {
  id?: string;
  label?: string | null;
  full_name?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  landmark?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  is_default?: boolean;
};

/** Add / edit address form (Figma 79:10376). Fills city and state from the pincode. */
export function AddressForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: AddressValues;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const [state, action, pending] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await saveAddress(prev, formData);
      if (result?.ok) {
        toast.success(result.message);
        onSaved?.();
      }
      return result;
    },
    null,
  );
  const [pincode, setPincode] = useState(initial?.pincode ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [region, setRegion] = useState(initial?.state ?? "");
  const errors = state?.errors ?? {};

  // Look up city/state when a full pincode is typed (only fills empty fields).
  useEffect(() => {
    if (!/^[1-9]\d{5}$/.test(pincode)) return;
    let cancelled = false;
    fetch(`/api/pincode/${pincode}`)
      .then((r) => r.json())
      .then((r: { valid: boolean; district?: string; state?: string }) => {
        if (cancelled || !r.valid) return;
        setCity((c) => c || r.district || "");
        setRegion(
          (s) =>
            s ||
            (INDIAN_STATES.find(
              (x) => x.toLowerCase() === r.state?.toLowerCase(),
            ) ??
              ""),
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pincode]);

  const field = (
    name: keyof AddressValues,
    label: string,
    props: React.ComponentProps<"input"> = {},
  ) => (
    <div>
      <Label htmlFor={`addr-${name}`}>{label}</Label>
      <Input
        id={`addr-${name}`}
        name={name}
        defaultValue={(initial?.[name] as string | null | undefined) ?? ""}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={`addr-${name}-error`}
        {...props}
      />
      <FieldError id={`addr-${name}-error`}>{errors[name]}</FieldError>
    </div>
  );

  return (
    <form action={action} className="grid gap-4 p-5 md:grid-cols-2" noValidate>
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      {field("full_name", "Full name", {
        autoComplete: "name",
        required: true,
      })}
      {field("phone", "Mobile number", {
        autoComplete: "tel",
        inputMode: "tel",
        required: true,
        placeholder: "10-digit mobile",
      })}
      <div className="md:col-span-2">
        {field("line1", "Flat / house no., building, street", {
          autoComplete: "address-line1",
          required: true,
        })}
      </div>
      {field("line2", "Area / locality (optional)", {
        autoComplete: "address-line2",
      })}
      {field("landmark", "Landmark (optional)")}
      <div>
        <Label htmlFor="addr-pincode">Pincode</Label>
        <Input
          id="addr-pincode"
          name="pincode"
          inputMode="numeric"
          maxLength={6}
          autoComplete="postal-code"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
          aria-invalid={errors.pincode ? true : undefined}
          required
        />
        <FieldError>{errors.pincode}</FieldError>
      </div>
      <div>
        <Label htmlFor="addr-city">City / district</Label>
        <Input
          id="addr-city"
          name="city"
          autoComplete="address-level2"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          aria-invalid={errors.city ? true : undefined}
          required
        />
        <FieldError>{errors.city}</FieldError>
      </div>
      <div>
        <Label htmlFor="addr-state">State</Label>
        <select
          id="addr-state"
          name="state"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-invalid={errors.state ? true : undefined}
          className="block w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none"
          required
        >
          <option value="">Choose state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <FieldError>{errors.state}</FieldError>
      </div>
      {field("label", "Label (optional)", {
        placeholder: "Home, Work, Studio…",
      })}
      <label className="flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
        <input
          type="checkbox"
          name="is_default"
          defaultChecked={initial?.is_default}
          className="size-4 accent-brand"
        />
        Make this my default address
      </label>
      {state?.message && !state.ok && (
        <p className="text-sm text-rose-600 md:col-span-2">{state.message}</p>
      )}
      <div className="flex justify-end gap-2 md:col-span-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={pending}>
          Save address
        </Button>
      </div>
    </form>
  );
}
