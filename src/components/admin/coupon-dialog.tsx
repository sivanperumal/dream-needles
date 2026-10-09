"use client";

import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import {
  CheckboxField,
  SelectField,
  TextField,
} from "@/components/admin/form-fields";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { saveCoupon } from "@/lib/admin/actions/content";
import type { Tables } from "@/types/database";

const toLocal = (iso: string | null) =>
  iso
    ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";

export function CouponDialog({ coupon }: { coupon?: Tables<"coupons"> }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useAdminForm(saveCoupon, () =>
    setOpen(false),
  );
  const e = state?.errors ?? {};
  return (
    <>
      {coupon ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          <Pencil className="size-3.5" aria-hidden="true" /> Edit
        </button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" aria-hidden="true" /> Add coupon
        </Button>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={coupon ? `Edit ${coupon.code}` : "Add coupon"}
        className="max-w-xl"
      >
        <form
          action={action}
          className="grid gap-4 p-5 sm:grid-cols-2"
          noValidate
        >
          {coupon && <input type="hidden" name="id" value={coupon.id} />}
          <TextField
            label="Code"
            name="code"
            defaultValue={coupon?.code}
            error={e.code}
            className="sm:col-span-2"
            placeholder="WELCOME10"
            required
          />
          <TextField
            label="Description (internal)"
            name="description"
            defaultValue={coupon?.description}
            className="sm:col-span-2"
          />
          <SelectField
            label="Type"
            name="discount_type"
            defaultValue={coupon?.discount_type ?? "percent"}
            options={[
              { value: "percent", label: "Percentage off" },
              { value: "fixed", label: "Fixed amount off (₹)" },
            ]}
          />
          <TextField
            label="Value"
            name="value"
            type="number"
            min="0"
            step="0.01"
            defaultValue={coupon?.value}
            error={e.value}
            required
          />
          <TextField
            label="Minimum order (₹)"
            name="min_subtotal"
            type="number"
            min="0"
            defaultValue={coupon?.min_subtotal ?? 0}
          />
          <TextField
            label="Maximum discount (₹)"
            name="max_discount"
            type="number"
            min="0"
            defaultValue={coupon?.max_discount ?? ""}
            hint="Optional cap for % coupons."
          />
          <TextField
            label="Starts"
            name="starts_at"
            type="datetime-local"
            defaultValue={toLocal(coupon?.starts_at ?? null)}
          />
          <TextField
            label="Ends"
            name="ends_at"
            type="datetime-local"
            defaultValue={toLocal(coupon?.ends_at ?? null)}
            error={e.ends_at}
          />
          <TextField
            label="Usage limit"
            name="usage_limit"
            type="number"
            min="1"
            defaultValue={coupon?.usage_limit ?? ""}
            hint="Total uses. Empty = unlimited."
          />
          <div className="flex items-end pb-2">
            <CheckboxField
              label="Active"
              name="is_active"
              defaultChecked={coupon?.is_active ?? true}
            />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save coupon
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
