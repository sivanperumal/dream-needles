import {
  AlertTriangle,
  IndianRupee,
  Package,
  ShoppingCart,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/account/order-ui";
import {
  Card,
  EmptyRow,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();
  const { data: settings } = await supabase
    .from("store_settings")
    .select("low_stock_threshold")
    .eq("id", 1)
    .single();
  const lowStock = settings?.low_stock_threshold ?? 5;

  const [revenueRows, toShip, recent, lowProducts, stockIssues] =
    await Promise.all([
      supabase
        .from("orders")
        .select("total, status")
        .in("status", ["paid", "shipped", "delivered"]),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "paid"),
      supabase
        .from("orders")
        .select("id, order_number, email, total, status, created_at")
        .neq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("products")
        .select("id, name, stock, status")
        .is("deleted_at", null)
        .lte("stock", lowStock)
        .order("stock")
        .limit(8),
      supabase
        .from("orders")
        .select("order_number")
        .eq("stock_issue", true)
        .eq("status", "paid"),
    ]);

  const paidOrders = revenueRows.data ?? [];
  const revenue = paidOrders.reduce((s, o) => s + o.total, 0);
  const kpis = [
    {
      label: "Total orders",
      value: paidOrders.length.toLocaleString("en-IN"),
      Icon: ShoppingCart,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Revenue",
      value: formatINR(revenue),
      Icon: IndianRupee,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Waiting to ship",
      value: String(toShip.count ?? 0),
      Icon: Truck,
      tone: "bg-amber-50 text-amber-700",
      href: "/admin/orders?status=paid",
    },
    {
      label: "Low stock",
      value: String(lowProducts.data?.length ?? 0),
      Icon: Package,
      tone: "bg-rose-50 text-rose-700",
      href: "/admin/products?stock=low",
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Paid, shipped and delivered orders are counted; unpaid checkouts are excluded."
      />

      {(stockIssues.data?.length ?? 0) > 0 && (
        <p className="mb-6 flex items-start gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-rose-200">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <span>
            {stockIssues.data!.length} paid{" "}
            {stockIssues.data!.length === 1 ? "order" : "orders"} had more items
            than were in stock:{" "}
            {stockIssues.data!.map((o, i) => (
              <span key={o.order_number}>
                {i > 0 && ", "}
                <Link
                  href={`/admin/orders/${o.order_number}`}
                  className="font-semibold underline"
                >
                  {o.order_number}
                </Link>
              </span>
            ))}
            . Contact the customer or refund in Razorpay.
          </span>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, Icon, tone, href }) => {
          const body = (
            <>
              <span
                className={`flex size-10 items-center justify-center rounded-lg ${tone}`}
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm text-gray-500">{label}</span>
                <span className="block text-2xl font-bold text-gray-900">
                  {value}
                </span>
              </span>
            </>
          );
          return href ? (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 hover:ring-brand/40"
            >
              {body}
            </Link>
          ) : (
            <div
              key={label}
              className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
            >
              {body}
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card
          title="Recent orders"
          actions={
            <Link
              href="/admin/orders"
              className="text-sm font-medium text-brand hover:underline"
            >
              View all
            </Link>
          }
        >
          <Table>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {(recent.data ?? []).map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <Td>
                    <Link
                      href={`/admin/orders/${o.order_number}`}
                      className="font-semibold text-brand hover:underline"
                    >
                      {o.order_number}
                    </Link>
                    <span className="block text-xs text-gray-500">
                      {dateFmt.format(new Date(o.created_at))}
                    </span>
                  </Td>
                  <Td className="max-w-48 truncate">{o.email}</Td>
                  <Td>
                    <StatusBadge status={o.status} />
                  </Td>
                  <Td className="text-right font-semibold">
                    {formatINR(o.total)}
                  </Td>
                </tr>
              ))}
              {!recent.data?.length && (
                <EmptyRow colSpan={4}>No orders yet.</EmptyRow>
              )}
            </tbody>
          </Table>
        </Card>

        <Card title={`Low stock (≤ ${lowStock})`}>
          <ul className="divide-y divide-gray-100">
            {(lowProducts.data ?? []).map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
              >
                <Link
                  href={`/admin/products/${p.id}`}
                  className="truncate text-gray-800 hover:text-brand"
                >
                  {p.name}
                </Link>
                <span
                  className={`shrink-0 font-semibold ${p.stock === 0 ? "text-rose-600" : "text-amber-600"}`}
                >
                  {p.stock === 0 ? "Sold out" : `${p.stock} left`}
                </span>
              </li>
            ))}
            {!lowProducts.data?.length && (
              <li className="px-5 py-8 text-center text-sm text-gray-500">
                All products are well stocked.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </>
  );
}
