import type { Metadata } from "next";
import { Suspense } from "react";
import {
  CheckoutClient,
  type CheckoutAddress,
} from "@/components/checkout/checkout-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutPage(props: PageProps<"/checkout">) {
  return (
    <Suspense
      fallback={
        <div
          className="container-page grid gap-6 py-10 lg:grid-cols-[1fr_440px]"
          aria-busy="true"
        >
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-96" />
        </div>
      }
    >
      <Checkout {...props} />
    </Suspense>
  );
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Checkout({ searchParams }: PageProps<"/checkout">) {
  const params = await searchParams;
  const user = await getCurrentUser();

  // "Buy Now" checks out a single item instead of the whole cart.
  const buy =
    typeof params.buy === "string" && uuid.test(params.buy) ? params.buy : null;
  const variant =
    typeof params.variant === "string" && uuid.test(params.variant)
      ? params.variant
      : null;
  const qty = Math.min(99, Math.max(1, Number(params.qty) || 1));
  const buyNow = buy
    ? { productId: buy, variantId: variant, quantity: qty }
    : null;

  let addresses: CheckoutAddress[] = [];
  let fullName = "";
  if (user) {
    const supabase = await createClient();
    const [{ data }, { data: profile }] = await Promise.all([
      supabase
        .from("addresses")
        .select(
          "id, label, full_name, phone, line1, line2, landmark, city, state, pincode, is_default",
        )
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    ]);
    addresses = (data ?? []) as CheckoutAddress[];
    fullName = profile?.full_name ?? "";
  }

  const query = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      typeof v === "string" ? [[k, v]] : [],
    ),
  ).toString();
  return (
    <CheckoutClient
      user={user ? { email: user.email ?? "", fullName } : null}
      addresses={addresses}
      buyNow={buyNow}
      returnTo={`/checkout${query ? `?${query}` : ""}`}
    />
  );
}
