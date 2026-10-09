import { AtSign, CreditCard, MapPin, Phone, Tag, Truck } from "lucide-react";
import Image from "next/image";
import { OrderTimeline, StatusBadge } from "@/components/account/order-ui";
import { imageUrl, PLACEHOLDER_IMAGE } from "@/lib/images";
import type { Tables } from "@/types/database";
import { formatINR } from "@/lib/utils";

type Order = Tables<"orders">;
type Item = Tables<"order_items">;
type Payment = Pick<
  Tables<"payments">,
  "status" | "method" | "razorpay_payment_id"
>;
type Address = {
  full_name?: string;
  line1?: string;
  line2?: string | null;
  landmark?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
};

const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

/** Order detail body (Figma 79:8573), shared by the account and admin pages. */
export function OrderDetail({
  order,
  items,
  payment,
  actions,
}: {
  order: Order;
  items: Item[];
  payment: Payment | null;
  actions?: React.ReactNode;
}) {
  const address = (order.shipping_address ?? {}) as Address;
  const itemsTotal = items.reduce((s, i) => s + i.line_total, 0);

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-[#210023]">
            Order #{order.order_number}
          </h2>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <StatusBadge status={order.status} />
            Placed {dateTime.format(new Date(order.created_at))} IST
          </p>
        </div>
        {actions}
      </section>

      {(order.status === "paid" ||
        order.status === "shipped" ||
        order.status === "delivered") && (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                Delivery
              </p>
              <p className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Truck className="size-5" aria-hidden="true" />
                {order.status === "delivered"
                  ? "Delivered"
                  : order.status === "shipped"
                    ? "On its way"
                    : "Preparing your order"}
              </p>
            </div>
            {order.tracking_number && (
              <div className="text-right text-sm">
                <p className="text-gray-500">Tracking number</p>
                {order.tracking_url ? (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand underline"
                  >
                    {order.tracking_number}
                  </a>
                ) : (
                  <p className="font-semibold text-gray-900">
                    {order.tracking_number}
                  </p>
                )}
              </div>
            )}
          </div>
          <OrderTimeline
            status={order.status}
            paidAt={order.paid_at}
            shippedAt={order.shipped_at}
            deliveredAt={order.delivered_at}
          />
        </section>
      )}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <h3 className="bg-[#f0f3ff] px-6 py-4 text-lg font-semibold text-gray-900">
          Items ({items.reduce((s, i) => s + i.quantity, 0)})
        </h3>
        <ul className="divide-y divide-gray-100 px-6">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-5">
              <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-gray-50">
                <Image
                  src={imageUrl(item.image_path) ?? PLACEHOLDER_IMAGE}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                <span className="absolute top-1 left-1 flex size-5 items-center justify-center rounded-full bg-[#210023] text-[11px] font-bold text-white">
                  {item.quantity}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-gray-900">
                  {item.product_name}
                </span>
                <span className="block text-sm text-gray-600">
                  {formatINR(item.unit_price)} each
                  {item.variant_label ? ` • ${item.variant_label}` : ""}
                  {item.sku ? ` • SKU ${item.sku}` : ""}
                </span>
              </span>
              <span className="font-semibold text-gray-900">
                {formatINR(item.line_total)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-2 border-t border-gray-100 px-6 py-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Item subtotal</dt>
            <dd>{formatINR(itemsTotal)}</dd>
          </div>
          {order.discount_total > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt className="flex items-center gap-1">
                <Tag className="size-3.5" aria-hidden="true" /> Discount
                {order.coupon_code ? ` (${order.coupon_code})` : ""}
              </dt>
              <dd>−{formatINR(order.discount_total)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-600">Shipping</dt>
            <dd
              className={
                order.shipping_total ? "" : "font-semibold text-emerald-600"
              }
            >
              {order.shipping_total ? formatINR(order.shipping_total) : "FREE"}
            </dd>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <dt>GST (included in price)</dt>
            <dd>{formatINR(order.gst_total)}</dd>
          </div>
          <div className="mt-3 flex items-end justify-between border-t border-gray-100 pt-4">
            <dt className="text-lg font-bold text-gray-900">
              Total{" "}
              <span className="text-xs font-normal text-gray-500">
                INR, all taxes included
              </span>
            </dt>
            <dd className="text-2xl font-bold text-[#210023]">
              {formatINR(order.total)}
            </dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-5 md:grid-cols-3">
        <InfoCard Icon={AtSign} label="Contact details">
          <p className="break-words text-gray-900">{order.email}</p>
          {order.phone && (
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
              <Phone className="size-3.5" aria-hidden="true" /> {order.phone}
            </p>
          )}
        </InfoCard>
        <InfoCard Icon={MapPin} label="Shipping address">
          <p className="font-semibold text-gray-900">{address.full_name}</p>
          <address className="text-sm leading-6 text-gray-600 not-italic">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
            <br />
            {address.city}, {address.state} {address.pincode}
          </address>
        </InfoCard>
        <InfoCard Icon={CreditCard} label="Payment method">
          <p className="font-semibold text-gray-900">Razorpay Secure</p>
          <p className="text-sm text-gray-600 capitalize">
            {payment?.method ?? "Online payment"}
          </p>
          {payment?.status === "captured" && (
            <p className="mt-2 inline-block rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Paid
              {payment.razorpay_payment_id
                ? ` • ${payment.razorpay_payment_id}`
                : ""}
            </p>
          )}
        </InfoCard>
      </div>
      {order.gift_note && (
        <p className="rounded-2xl bg-brand-light/60 p-5 text-sm text-gray-700">
          <span className="font-semibold text-brand">Gift note:</span>{" "}
          {order.gift_note}
        </p>
      )}
    </div>
  );
}

function InfoCard({
  Icon,
  label,
  children,
}: {
  Icon: typeof AtSign;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <span className="flex size-10 items-center justify-center rounded-full bg-[#eaeefa] text-gray-800">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 mb-1 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
        {label}
      </h3>
      {children}
    </section>
  );
}
