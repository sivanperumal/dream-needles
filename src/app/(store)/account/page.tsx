import {
  ArrowRight,
  Mail,
  Package,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EditProfileButton } from "@/components/account/account-ui";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfile, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <Profile />
    </Suspense>
  );
}

const joined = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
});

async function Profile() {
  await requireUser("/account");
  const profile = await getProfile();
  if (!profile) return null;
  const supabase = await createClient();
  const [{ count: orders }, { data: address }] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .neq("status", "pending"),
    supabase
      .from("addresses")
      .select("full_name, line1, city, state, pincode, phone")
      .eq("is_default", true)
      .maybeSingle(),
  ]);
  const name = profile.full_name || profile.email.split("@")[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100">
          <span
            className="flex size-24 items-center justify-center rounded-full bg-brand text-4xl font-bold text-white"
            aria-hidden="true"
          >
            {name[0]?.toUpperCase()}
          </span>
          <p className="mt-4 text-2xl font-bold text-[#210023]">{name}</p>
          <p className="text-sm text-gray-600">{profile.email}</p>
          <p className="mt-2 rounded-full bg-[#e8dcea] px-3 py-1 text-xs font-semibold text-[#210023]">
            Member since {joined.format(new Date(profile.created_at))}
          </p>
          <div className="mt-5 w-full">
            <EditProfileButton
              fullName={profile.full_name ?? ""}
              phone={profile.phone ?? ""}
            />
          </div>
        </section>
        <Link
          href="/account/orders"
          className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 hover:ring-purple-200"
        >
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-light text-brand">
              <Package className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-2xl font-bold text-gray-900">
                {orders ?? 0}
              </span>
              <span className="text-sm text-gray-600">Orders placed</span>
            </span>
          </span>
          <ArrowRight className="size-5 text-gray-400" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
            Account details
          </p>
          <h2 className="text-2xl font-bold text-[#210023]">
            Primary Contact Details
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              {
                Icon: UserRound,
                label: "Full name",
                value: profile.full_name || "Not added yet",
                hint: profile.phone
                  ? `Mobile ${profile.phone}`
                  : "Add your mobile number",
              },
              {
                Icon: Mail,
                label: "Email address",
                value: profile.email,
                hint: "Used to sign in and for order updates",
              },
            ].map(({ Icon, label, value, hint }) => (
              <div
                key={label}
                className="flex gap-3 rounded-xl bg-[#f0f3ff] p-5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-gray-700">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-wide text-gray-600 uppercase">
                    {label}
                  </p>
                  <p className="mt-1 text-lg break-words text-gray-900">
                    {value}
                  </p>
                  <p className="text-sm text-gray-500">{hint}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                Delivery
              </p>
              <h2 className="text-2xl font-bold text-[#210023]">
                Shipping Address
              </h2>
            </div>
            <Link
              href="/account/addresses"
              className="text-sm font-semibold text-brand hover:underline"
            >
              Manage addresses →
            </Link>
          </div>
          {address ? (
            <div className="mt-5 rounded-xl bg-[#f0f3ff] p-5 text-sm text-gray-700">
              <p className="text-lg font-semibold text-gray-900">
                {address.full_name}
              </p>
              <p className="mt-1">
                {address.line1}, {address.city}, {address.state} –{" "}
                {address.pincode}
              </p>
              <p className="mt-1 font-semibold">{address.phone}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-600">
              No default address yet.{" "}
              <Link
                href="/account/addresses"
                className="font-semibold text-brand"
              >
                Add one
              </Link>{" "}
              for faster checkout.
            </p>
          )}
        </section>

        <p className="flex items-center justify-end gap-1.5 text-xs text-gray-500">
          <ShieldCheck className="size-3.5" aria-hidden="true" /> Your data is
          protected and never shared.
        </p>
      </div>
    </div>
  );
}
