import { ConfirmButton } from "@/components/admin/confirm-button";
import { CouponDialog } from "@/components/admin/coupon-dialog";
import {
  Card,
  EmptyRow,
  PageHeader,
  Pill,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteCoupon } from "@/lib/admin/actions/content";
import { checkCoupon, type CouponRow } from "@/lib/coupons";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Coupons" };
const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function CouponsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  return (
    <>
      <PageHeader
        title="Coupons"
        description="Discount codes customers can enter at checkout."
        actions={<CouponDialog />}
      />
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>Discount</Th>
              <Th>Minimum</Th>
              <Th>Used</Th>
              <Th>Valid</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((c) => {
              const check = checkCoupon(
                c as CouponRow,
                Number.MAX_SAFE_INTEGER,
              );
              return (
                <tr key={c.id}>
                  <Td>
                    <span className="font-mono font-semibold text-gray-900">
                      {c.code}
                    </span>
                    {c.description && (
                      <span className="block text-xs text-gray-500">
                        {c.description}
                      </span>
                    )}
                  </Td>
                  <Td>
                    {c.discount_type === "percent"
                      ? `${c.value}%`
                      : formatINR(c.value)}
                    {c.max_discount ? (
                      <span className="block text-xs text-gray-500">
                        max {formatINR(c.max_discount)}
                      </span>
                    ) : null}
                  </Td>
                  <Td>{c.min_subtotal ? formatINR(c.min_subtotal) : "—"}</Td>
                  <Td>
                    {c.used_count}
                    {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                  </Td>
                  <Td className="text-xs">
                    {c.starts_at
                      ? dateFmt.format(new Date(c.starts_at))
                      : "Now"}{" "}
                    –{" "}
                    {c.ends_at ? dateFmt.format(new Date(c.ends_at)) : "No end"}
                  </Td>
                  <Td>
                    {check.ok ? (
                      <Pill tone="green">Usable</Pill>
                    ) : (
                      <Pill tone={c.is_active ? "amber" : "gray"}>
                        {check.reason.replace("_", " ")}
                      </Pill>
                    )}
                  </Td>
                  <Td>
                    <span className="flex items-center justify-end gap-3">
                      <CouponDialog coupon={c} />
                      <ConfirmButton
                        variant="ghost"
                        danger
                        title={`Delete ${c.code}?`}
                        message="Past orders keep their discount. Customers won't be able to use this code any more."
                        confirmLabel="Delete"
                        action={deleteCoupon.bind(null, c.id)}
                        className="text-rose-600"
                      >
                        Delete
                      </ConfirmButton>
                    </span>
                  </Td>
                </tr>
              );
            })}
            {!data?.length && <EmptyRow colSpan={7}>No coupons yet.</EmptyRow>}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
