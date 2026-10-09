export const ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  shipped: "bg-blue-50 text-blue-700",
  delivered: "bg-purple-50 text-purple-700",
  cancelled: "bg-gray-100 text-gray-600",
};

/** Allowed admin transitions: pending → paid → shipped → delivered; cancel before delivery. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus) =>
  NEXT_STATUSES[from].includes(to);
