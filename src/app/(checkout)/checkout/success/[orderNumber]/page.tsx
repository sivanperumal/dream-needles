import { CheckCircle2, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RefreshCartOnMount } from "@/components/account/order-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export default function SuccessPage(
  props: PageProps<"/checkout/success/[orderNumber]">,
) {
  return (
    <div className="container-page flex justify-center py-16">
      <Suspense
        fallback={<Skeleton className="h-80 w-full max-w-xl rounded-2xl" />}
      >
        <Success {...props} />
      </Suspense>
    </div>
  );
}

async function Success({
  params,
}: PageProps<"/checkout/success/[orderNumber]">) {
  const { orderNumber } = await params;
  const decoded = decodeURIComponent(orderNumber);
  await requireUser(`/checkout/success/${orderNumber}`);
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("order_number, status, total, email")
    .eq("order_number", decoded)
    .maybeSingle();
  if (!order) notFound();
  const paid = order.status !== "pending" && order.status !== "cancelled";

  return (
    <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100 md:p-10">
      <RefreshCartOnMount />
      {paid ? (
        <CheckCircle2
          className="mx-auto size-14 text-emerald-500"
          aria-hidden="true"
        />
      ) : (
        <Clock className="mx-auto size-14 text-amber-500" aria-hidden="true" />
      )}
      <h1 className="mt-4 text-3xl font-extrabold text-[#210023]">
        {paid ? "Thank you for your order!" : "Confirming your payment…"}
      </h1>
      <p className="mt-3 text-gray-600">
        {paid
          ? `Order ${order.order_number} is confirmed. We've emailed the details to ${order.email}.`
          : `We're waiting for the payment confirmation for order ${order.order_number}. This usually takes a few seconds. Refresh this page in a moment.`}
      </p>
      <p className="mt-4 text-2xl font-bold text-gray-900">
        {formatINR(order.total)}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href={`/account/orders/${encodeURIComponent(order.order_number)}`}
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-hover"
        >
          View order
        </Link>
        <Link
          href="/collections/whats-new"
          className="rounded-full bg-brand-light px-6 py-3 text-sm font-semibold text-brand"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
