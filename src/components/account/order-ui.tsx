import { Check, Home, PackageCheck, Truck } from "lucide-react";
import {
  STATUS_LABEL,
  STATUS_TONE,
  type OrderStatus,
} from "@/lib/order-status";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const s = status as OrderStatus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase",
        STATUS_TONE[s],
      )}
    >
      {s === "delivered" || s === "paid" ? (
        <Check className="size-3" aria-hidden="true" />
      ) : null}
      {STATUS_LABEL[s] ?? status}
    </span>
  );
}

const dateShort = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

/** Order progress tracker (Figma 79:8573). */
export function OrderTimeline({
  status,
  paidAt,
  shippedAt,
  deliveredAt,
}: {
  status: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}) {
  if (status === "cancelled" || status === "pending") return null;
  const steps = [
    { label: "Confirmed", at: paidAt, Icon: Check },
    { label: "Packed & shipped", at: shippedAt, Icon: Truck },
    { label: "Delivered", at: deliveredAt, Icon: Home },
  ];
  const reached = status === "delivered" ? 3 : status === "shipped" ? 2 : 1;
  return (
    <div>
      <div
        className="relative mx-[16%] h-1.5 rounded-full bg-[#eaeefa]"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${((reached - 1) / 2) * 100}%` }}
        />
      </div>
      <ol className="mt-[-15px] grid grid-cols-3">
        {steps.map(({ label, at, Icon }, i) => {
          const done = i < reached;
          return (
            <li key={label} className="flex flex-col items-center text-center">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full",
                  done ? "bg-brand text-white" : "bg-gray-100 text-gray-400",
                )}
              >
                {i === 1 && done ? (
                  <PackageCheck className="size-3.5" aria-hidden="true" />
                ) : (
                  <Icon className="size-3.5" aria-hidden="true" />
                )}
              </span>
              <span
                className={cn(
                  "mt-2 text-xs font-semibold",
                  done ? "text-gray-900" : "text-gray-400",
                )}
              >
                {label}
              </span>
              <span className="text-[11px] text-gray-500">
                {at ? dateShort.format(new Date(at)) : done ? "" : "Pending"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
