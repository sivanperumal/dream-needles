import type { Metadata } from "next";
import { Suspense } from "react";
import { AddressBook, type AddressRow } from "@/components/account/account-ui";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My Addresses",
  robots: { index: false },
};

export default function AddressesPage() {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
        Logistics &amp; delivery
      </p>
      <h2 className="mb-6 text-2xl font-bold text-[#210023]">
        Shipping Addresses
      </h2>
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <Addresses />
      </Suspense>
    </section>
  );
}

async function Addresses() {
  await requireUser("/account/addresses");
  const supabase = await createClient();
  const { data } = await supabase
    .from("addresses")
    .select(
      "id, label, full_name, phone, line1, line2, landmark, city, state, pincode, is_default",
    )
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  return <AddressBook addresses={(data ?? []) as AddressRow[]} />;
}
