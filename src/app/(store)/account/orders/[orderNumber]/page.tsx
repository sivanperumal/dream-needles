import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BuyAgainButton } from "@/components/account/order-actions";
import { OrderDetail } from "@/components/account/order-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false },
};

export default function OrderPage(
  props: PageProps<"/account/orders/[orderNumber]">,
) {
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/account/orders"
        className="mb-5 flex w-fit items-center gap-1 text-sm font-semibold text-[#210023] hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to Orders
      </Link>
      <Suspense
        fallback={<Skeleton className="h-[600px] w-full rounded-2xl" />}
      >
        <Order {...props} />
      </Suspense>
    </div>
  );
}

async function Order({ params }: PageProps<"/account/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  await requireUser(`/account/orders/${orderNumber}`);
  const supabase = await createClient();
  // RLS limits this to the signed-in customer's own orders.
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", decodeURIComponent(orderNumber))
    .maybeSingle();
  if (!order) notFound();
  const [{ data: items }, { data: payment }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", order.id),
    supabase
      .from("payments")
      .select("status, method, razorpay_payment_id")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <OrderDetail
      order={order}
      items={items ?? []}
      payment={payment}
      actions={
        <BuyAgainButton
          items={(items ?? []).map((i) => ({
            productId: i.product_id,
            variantId: i.variant_id,
            quantity: i.quantity,
          }))}
        />
      }
    />
  );
}
