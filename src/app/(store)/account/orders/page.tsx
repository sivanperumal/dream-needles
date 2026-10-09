import { ArrowRight, Headset, Package, Truck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { StatusBadge } from "@/components/account/order-ui";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth";
import { imageUrl, PLACEHOLDER_IMAGE } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Orders",
  robots: { index: false },
};

const dateLong = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function OrdersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <Orders />
    </Suspense>
  );
}

async function Orders() {
  await requireUser("/account/orders");
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, total, created_at, delivered_at, order_items (product_name, variant_label, quantity, image_path)",
    )
    .neq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);
  const list = orders ?? [];
  const inTransit = list.filter((o) => o.status === "shipped").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 rounded-2xl bg-[#f0f3ff] p-5 sm:grid-cols-2">
        {[
          {
            Icon: Package,
            value: `${list.length} ${list.length === 1 ? "Order" : "Orders"}`,
            hint: "Handmade with care",
          },
          {
            Icon: Truck,
            value: `${inTransit} In transit`,
            hint: "Tracking details emailed to you",
          },
        ].map(({ Icon, value, hint }) => (
          <div key={hint} className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-white text-gray-700">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-semibold text-gray-900">
                {value}
              </span>
              <span className="text-sm text-gray-600">{hint}</span>
            </span>
          </div>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
          <p className="text-lg font-semibold text-gray-900">No orders yet</p>
          <p className="mt-1 text-sm text-gray-600">
            When you place an order, it will appear here.
          </p>
          <Link
            href="/collections/whats-new"
            className="mt-4 inline-block font-semibold text-brand hover:underline"
          >
            Start shopping →
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-5">
          {list.map((o) => {
            const first = o.order_items[0];
            const more = o.order_items.length - 1;
            return (
              <li
                key={o.id}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 md:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="flex flex-wrap items-center gap-3 text-sm">
                    <StatusBadge status={o.status} />
                    <span className="font-semibold text-gray-900">
                      #{o.order_number}
                    </span>
                    <span className="text-gray-500">
                      • {dateLong.format(new Date(o.created_at))}
                    </span>
                  </p>
                  <p className="text-xl font-bold text-[#210023]">
                    {formatINR(o.total)}
                  </p>
                </div>
                {first && (
                  <div className="mt-4 flex items-center gap-4 rounded-xl bg-[#f0f3ff] p-4">
                    <Image
                      src={imageUrl(first.image_path) ?? PLACEHOLDER_IMAGE}
                      alt=""
                      width={88}
                      height={88}
                      className="size-20 shrink-0 rounded-lg object-cover md:size-[88px]"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">
                        {first.product_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Qty: {first.quantity}
                        {first.variant_label ? ` • ${first.variant_label}` : ""}
                      </p>
                      {more > 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                          + {more} more {more === 1 ? "item" : "items"}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <Link
                    href={`/account/orders/${encodeURIComponent(o.order_number)}`}
                    className="flex items-center gap-1 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
                  >
                    View Order Details{" "}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#ece6f2] p-6">
        <p className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-full bg-white text-gray-800">
            <Headset className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-lg font-semibold text-gray-900">
              Need help with an order?
            </span>
            <span className="text-sm text-gray-600">
              Our team can help with tracking, returns and anything else.
            </span>
          </span>
        </p>
        <Link
          href="/contact"
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
}
