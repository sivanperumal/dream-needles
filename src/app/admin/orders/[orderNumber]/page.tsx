import { AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";
import { OrderDetail } from "@/components/account/order-detail";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import type { OrderStatus } from "@/lib/order-status";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Order" };
const dateFmt = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export default async function AdminOrderPage({
  params,
}: PageProps<"/admin/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  const { supabase } = await requireAdmin();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", decodeURIComponent(orderNumber))
    .maybeSingle();
  if (!order) notFound();
  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", order.id),
    supabase
      .from("payments")
      .select(
        "id, status, method, razorpay_payment_id, amount, error_description, source, created_at",
      )
      .eq("order_id", order.id)
      .order("created_at"),
  ]);
  const captured = payments?.find((p) => p.status === "captured") ?? null;

  return (
    <>
      <PageHeader
        title={`Order ${order.order_number}`}
        back={{ href: "/admin/orders", label: "Orders" }}
      />
      {order.stock_issue && (
        <p className="mb-6 flex items-start gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-rose-200">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          This order was paid when some items were already out of stock. Contact
          the customer, or cancel and refund it in Razorpay.
        </p>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <OrderDetail order={order} items={items ?? []} payment={captured} />
        <div className="flex flex-col gap-6 xl:sticky xl:top-24">
          <OrderStatusForm
            orderId={order.id}
            status={order.status as OrderStatus}
            trackingNumber={order.tracking_number}
            trackingUrl={order.tracking_url}
            adminNote={order.admin_note}
          />
          <Card title="Payment attempts">
            <ul className="divide-y divide-gray-100 text-sm">
              {(payments ?? []).map((p) => (
                <li key={p.id} className="px-5 py-3">
                  <p className="flex justify-between">
                    <span
                      className={
                        p.status === "captured"
                          ? "font-semibold text-emerald-700"
                          : p.status === "failed"
                            ? "font-semibold text-rose-600"
                            : "text-gray-600"
                      }
                    >
                      {p.status}
                    </span>
                    <span>{formatINR(p.amount)}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {dateFmt.format(new Date(p.created_at))} · {p.source}
                    {p.method ? ` · ${p.method}` : ""}
                  </p>
                  {p.razorpay_payment_id && (
                    <p className="font-mono text-xs text-gray-500">
                      {p.razorpay_payment_id}
                    </p>
                  )}
                  {p.error_description && (
                    <p className="text-xs text-rose-600">
                      {p.error_description}
                    </p>
                  )}
                </li>
              ))}
              {!payments?.length && (
                <li className="px-5 py-4 text-gray-500">
                  No payment attempts.
                </li>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
