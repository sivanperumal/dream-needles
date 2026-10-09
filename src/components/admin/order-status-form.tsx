"use client";

import { useState } from "react";
import {
  CheckboxField,
  TextArea,
  TextField,
} from "@/components/admin/form-fields";
import { Card } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { Button } from "@/components/ui/button";
import { updateOrder } from "@/lib/admin/actions/orders";
import {
  NEXT_STATUSES,
  type OrderStatus,
  STATUS_LABEL,
} from "@/lib/order-status";

export function OrderStatusForm({
  orderId,
  status,
  trackingNumber,
  trackingUrl,
  adminNote,
}: {
  orderId: string;
  status: OrderStatus;
  trackingNumber: string | null;
  trackingUrl: string | null;
  adminNote: string | null;
}) {
  const [next, setNext] = useState<OrderStatus>(status);
  const [, action, pending] = useAdminForm(updateOrder);
  const options = [status, ...NEXT_STATUSES[status]];

  return (
    <Card title="Update order">
      <form action={action} className="grid gap-4 p-5">
        <input type="hidden" name="orderId" value={orderId} />
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-700">
            Status
          </legend>
          <div className="flex flex-wrap gap-2">
            {options.map((s) => (
              <label
                key={s}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${next === s ? "border-brand bg-brand text-white" : "border-gray-200 text-gray-700 hover:border-brand"}`}
              >
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={next === s}
                  onChange={() => setNext(s)}
                  className="sr-only"
                />
                {s === status
                  ? `${STATUS_LABEL[s]} (current)`
                  : `→ ${STATUS_LABEL[s]}`}
              </label>
            ))}
          </div>
          {!NEXT_STATUSES[status].length && (
            <p className="mt-2 text-xs text-gray-500">
              This order is final and can&apos;t change status.
            </p>
          )}
        </fieldset>
        <TextField
          label="Tracking number"
          name="tracking_number"
          defaultValue={trackingNumber ?? ""}
          hint="Required when marking as shipped."
        />
        <TextField
          label="Tracking link"
          name="tracking_url"
          type="url"
          defaultValue={trackingUrl ?? ""}
          placeholder="https://…"
        />
        <TextArea
          label="Internal note"
          name="admin_note"
          rows={2}
          defaultValue={adminNote ?? ""}
          hint="Only visible to admins."
        />
        {next !== status && (
          <CheckboxField
            label="Email the customer about this change"
            name="notify"
            defaultChecked
            hint="Shipped, delivered and cancelled emails include the order details."
          />
        )}
        {next === "cancelled" && status !== "pending" && (
          <>
            <CheckboxField
              label="Return the items to stock"
              name="restock"
              defaultChecked
            />
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              Cancelling here doesn&apos;t refund the payment. Refund it in the
              Razorpay dashboard (Transactions → Payments → Refund).
            </p>
          </>
        )}
        <Button type="submit" loading={pending}>
          {next === status
            ? "Save details"
            : `Mark as ${STATUS_LABEL[next].toLowerCase()}`}
        </Button>
      </form>
    </Card>
  );
}
