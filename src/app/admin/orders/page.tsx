import Link from "next/link";
import { StatusBadge } from "@/components/account/order-ui";
import {
  adminInput,
  Card,
  EmptyRow,
  FilterBar,
  PageHeader,
  SimplePager,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { ORDER_STATUSES, STATUS_LABEL } from "@/lib/order-status";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Orders" };
const PER_PAGE = 30;
const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export default async function OrdersPage({
  searchParams,
}: PageProps<"/admin/orders">) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const status =
    typeof sp.status === "string" &&
    (ORDER_STATUSES as readonly string[]).includes(sp.status)
      ? sp.status
      : "";
  const q =
    typeof sp.q === "string"
      ? sp.q
          .trim()
          .slice(0, 80)
          .replace(/[%,()]/g, " ")
      : "";
  const page = Math.max(1, Number(sp.page) || 1);

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, email, status, total, created_at, stock_issue, order_items (quantity)",
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE);
  if (status) query = query.eq("status", status);
  else query = query.neq("status", "pending"); // unpaid checkouts are hidden unless asked for
  if (q) query = query.or(`order_number.ilike.%${q}%,email.ilike.%${q}%`);
  const { data } = await query;
  const orders = (data ?? []).slice(0, PER_PAGE);

  return (
    <>
      <PageHeader
        title="Orders"
        description="Unpaid (abandoned) checkouts are hidden; choose “Awaiting payment” to see them."
      />
      <Card>
        <FilterBar>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Search
            <input
              name="q"
              defaultValue={q}
              placeholder="Order number or email"
              className={`${adminInput} w-64`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Status
            <select name="status" defaultValue={status} className={adminInput}>
              <option value="">All paid orders</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        </FilterBar>
        <Table>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Date</Th>
              <Th>Customer</Th>
              <Th>Items</Th>
              <Th>Status</Th>
              <Th className="text-right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <Td>
                  <Link
                    href={`/admin/orders/${o.order_number}`}
                    className="font-semibold text-brand hover:underline"
                  >
                    {o.order_number}
                  </Link>
                  {o.stock_issue && (
                    <span className="ml-2 text-xs font-semibold text-rose-600">
                      Stock issue
                    </span>
                  )}
                </Td>
                <Td className="text-xs whitespace-nowrap">
                  {dateFmt.format(new Date(o.created_at))}
                </Td>
                <Td className="max-w-56 truncate">{o.email}</Td>
                <Td>{o.order_items.reduce((s, i) => s + i.quantity, 0)}</Td>
                <Td>
                  <StatusBadge status={o.status} />
                </Td>
                <Td className="text-right font-semibold">
                  {formatINR(o.total)}
                </Td>
              </tr>
            ))}
            {!orders.length && (
              <EmptyRow colSpan={6}>No orders found.</EmptyRow>
            )}
          </tbody>
        </Table>
        <SimplePager
          page={page}
          hasMore={(data?.length ?? 0) > PER_PAGE}
          makeHref={(p) =>
            `/admin/orders?${new URLSearchParams(Object.entries({ q, status, page: String(p) }).filter(([, v]) => v))}`
          }
        />
      </Card>
    </>
  );
}
