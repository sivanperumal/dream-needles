"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  Gift,
  LifeBuoy,
  Lock,
  Plus,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { AddressForm } from "@/components/account/address-form";
import { CodeForm, EmailForm } from "@/components/auth/login-forms";
import { useShop } from "@/components/providers/shop-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { previewCheckout } from "@/lib/actions/checkout";
import { signOut } from "@/lib/actions/auth";
import type { CheckoutSummary } from "@/lib/checkout";
import { imageUrl, PLACEHOLDER_IMAGE } from "@/lib/images";
import { cn, formatINR } from "@/lib/utils";

export type CheckoutAddress = {
  id: string;
  label: string | null;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

type BuyNow = {
  productId: string;
  variantId: string | null;
  quantity: number;
} | null;

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayInstance = {
  open: () => void;
  on: (
    event: string,
    cb: (r: { error?: { description?: string } }) => void,
  ) => void;
};
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/** Checkout (Figma 77:5928 signed in, 77:6135 verification step). */
export function CheckoutClient({
  user,
  addresses,
  buyNow,
  returnTo,
}: {
  user: { email: string; fullName: string } | null;
  addresses: CheckoutAddress[];
  buyNow: BuyNow;
  returnTo: string;
}) {
  const router = useRouter();
  const { ready, cart, reloadCart, syncSession, user: shopUser } = useShop();
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [addressId, setAddressId] = useState<string | null>(
    addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? null,
  );
  const [addingAddress, setAddingAddress] = useState(addresses.length === 0);
  const [giftNote, setGiftNote] = useState("");
  const [showGift, setShowGift] = useState(false);
  const [paying, setPaying] = useState(false);
  const [codeEmail, setCodeEmail] = useState<string | null>(null);
  const cartKey = JSON.stringify(cart);

  // Signed in on this page (server session): merge the guest cart before pricing it.
  const sessionSynced = !user || Boolean(shopUser);
  useEffect(() => {
    if (ready && user && !shopUser) void syncSession();
  }, [ready, user, shopUser, syncSession]);

  // Server-computed summary; refreshes when the cart or coupon changes.
  const isGuest = !user;
  useEffect(() => {
    if (!ready || !sessionSynced) return;
    let cancelled = false;
    const guestLines = isGuest
      ? (JSON.parse(cartKey) as typeof cart)
      : undefined;
    previewCheckout({ couponCode, buyNow, guestLines }).then((result) => {
      if (!cancelled) setSummary(result);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, sessionSynced, couponCode, buyNow, isGuest, cartKey]);

  // Keep the selected address valid after the list changes.
  const [lastAddresses, setLastAddresses] = useState(addresses);
  if (lastAddresses !== addresses) {
    setLastAddresses(addresses);
    if (!addresses.some((a) => a.id === addressId))
      setAddressId(
        addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? null,
      );
    if (addresses.length) setAddingAddress(false);
  }

  const applyCoupon = () => {
    const code = couponInput.trim();
    if (code) setCouponCode(code);
  };

  const pay = async () => {
    if (!summary || !addressId) return;
    setPaying(true);
    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId,
          couponCode: summary.coupon.applied ? couponCode : null,
          giftNote: giftNote || null,
          buyNow,
        }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error ?? "Could not start payment.");
      if (!(await loadRazorpayScript()) || !window.Razorpay)
        throw new Error(
          "Couldn't load the payment window. Check your connection.",
        );

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Dream Needles",
        description: `Order ${order.orderNumber}`,
        image: `${window.location.origin}/images/brand/favicon-32.png`,
        order_id: order.razorpayOrderId,
        prefill: order.prefill,
        theme: { color: "#4d0851" },
        handler: async (response: RazorpayResponse) => {
          const verify = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const result = await verify.json();
          if (!verify.ok) {
            toast.error(result.error ?? "Payment verification failed.");
            setPaying(false);
            return;
          }
          await reloadCart();
          router.push(
            `/checkout/success/${encodeURIComponent(result.orderNumber)}`,
          );
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast(
              "Payment cancelled. Your cart is saved, so you can try again.",
            );
          },
        },
      });
      rzp.on("payment.failed", (r) => {
        toast.error(
          r.error?.description ?? "Payment failed. Please try another method.",
        );
      });
      rzp.open();
    } catch (error) {
      toast.error((error as Error).message);
      setPaying(false);
    }
  };

  const verified = Boolean(user);
  const lines = summary?.lines ?? [];
  const empty = ready && summary !== null && lines.length === 0;
  const selected = addresses.find((a) => a.id === addressId);

  if (empty) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Your cart is empty</h1>
        <p className="mt-2 text-gray-600">
          Add something lovely before checking out.
        </p>
        <Link
          href="/collections/whats-new"
          className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white"
        >
          Shop What&apos;s New
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page grid items-start gap-6 py-8 md:py-10 lg:grid-cols-[1fr_440px]">
      <h1 className="sr-only">Checkout</h1>
      {!user && (
        // Signed-out visitors can go back to browsing without signing in.
        <Link
          href="/"
          className="-mb-2 flex w-fit items-center gap-2 text-[15px] font-medium text-brand hover:underline lg:col-span-2"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to Shopping
        </Link>
      )}
      <div className="flex flex-col gap-5">
        {/* 1. Customer */}
        <Step
          number={1}
          title={verified ? "Account" : "Customer Information & Verification"}
          active={!verified}
          done={verified}
        >
          {user ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-brand-light font-semibold text-brand">
                  {(user.fullName || user.email)[0]?.toUpperCase()}
                </span>
                <div>
                  <p className="text-xs text-gray-500">Signed in as</p>
                  <p className="font-semibold text-gray-900">{user.email}</p>
                </div>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm font-semibold text-brand underline"
                >
                  Log out
                </button>
              </form>
            </div>
          ) : codeEmail ? (
            <div className="rounded-xl bg-brand-tint p-5 ring-1 ring-purple-100">
              <p className="font-semibold text-gray-900">
                Enter verification code
              </p>
              <p className="mb-4 text-sm text-gray-600">
                We&apos;ve sent a 6-digit code to <strong>{codeEmail}</strong>
              </p>
              <CodeForm
                email={codeEmail}
                next={returnTo}
                onChangeEmail={() => setCodeEmail(null)}
              />
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-gray-600">
                Enter your email to sign in or create an account. We&apos;ll
                send a verification code to secure your order.
              </p>
              <EmailForm next={returnTo} inline onSent={setCodeEmail} />
            </>
          )}
        </Step>

        {/* 2. Address */}
        <Step
          number={2}
          title="Ship To"
          locked={!verified}
          lockedHint="Unlocks after verification"
          active={verified}
          done={verified && Boolean(selected) && !addingAddress}
        >
          {verified && (
            <>
              {addresses.length > 0 && (
                <fieldset className="flex flex-col gap-3">
                  <legend className="sr-only">Delivery address</legend>
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition-colors",
                        addressId === a.id
                          ? "border-brand bg-brand-tint/40"
                          : "border-gray-100 hover:border-purple-200",
                      )}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={a.id}
                        checked={addressId === a.id}
                        onChange={() => setAddressId(a.id)}
                        className="mt-1 size-4 accent-blue-600"
                      />
                      <span className="text-sm">
                        <span className="block font-semibold text-gray-900">
                          {a.full_name}
                        </span>
                        <span className="block text-gray-600">
                          {a.line1}
                          {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state},{" "}
                          {a.pincode}
                        </span>
                        <span className="block text-gray-600">{a.phone}</span>
                        {a.is_default && (
                          <span className="mt-2 inline-block rounded bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">
                            Default
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </fieldset>
              )}
              {addingAddress ? (
                <div className="mt-4 rounded-xl ring-1 ring-gray-100">
                  <AddressForm
                    onSaved={() => router.refresh()}
                    onCancel={
                      addresses.length
                        ? () => setAddingAddress(false)
                        : undefined
                    }
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingAddress(true)}
                  className="mt-4 flex items-center gap-2 border-t border-dashed border-gray-200 pt-4 text-sm font-semibold text-brand"
                >
                  <Plus className="size-4" aria-hidden="true" /> Use a different
                  address
                </button>
              )}
            </>
          )}
        </Step>

        {/* 3. Shipping method */}
        <Step
          number={3}
          title="Shipping Method"
          locked={!verified}
          lockedHint="Standard delivery"
          active={verified}
          done={verified}
        >
          {verified && summary && (
            <label className="flex gap-3 rounded-xl border-2 border-purple-200 bg-brand-tint/40 p-4">
              <input
                type="radio"
                checked
                readOnly
                className="mt-1 size-4 accent-blue-600"
              />
              <span className="flex-1 text-sm">
                <span className="flex items-center justify-between font-semibold text-gray-900">
                  Standard Delivery (Prepaid Online)
                  <span
                    className={
                      summary.totals.shipping
                        ? "text-gray-900"
                        : "text-emerald-600"
                    }
                  >
                    {summary.totals.shipping
                      ? formatINR(summary.totals.shipping)
                      : "FREE"}
                  </span>
                </span>
                <span className="text-gray-600">
                  {summary.settings.delivery_eta_text}. Tracking updates are
                  emailed to you.
                </span>
              </span>
            </label>
          )}
        </Step>

        {/* 4. Payment */}
        <Step
          number={4}
          title="Payment"
          locked={!verified}
          lockedHint="UPI, Cards, Net Banking"
          active={verified}
        >
          {verified && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border-2 border-brand p-4">
                <p className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-gray-900">
                    <CreditCard className="size-4" aria-hidden="true" />{" "}
                    Razorpay Secure
                  </span>
                  <span className="flex items-center gap-1 text-xs text-emerald-700">
                    <ShieldCheck className="size-3.5" aria-hidden="true" />{" "}
                    Encrypted
                  </span>
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  UPI (GPay, PhonePe, Paytm), credit &amp; debit cards, net
                  banking and wallets.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowGift(!showGift)}
                  className="flex items-center gap-2 text-sm font-semibold text-brand"
                  aria-expanded={showGift}
                >
                  <Gift className="size-4" aria-hidden="true" />{" "}
                  {showGift ? "Gift note" : "Add a gift note (free)"}
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      showGift && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>
                {showGift && (
                  <div className="mt-2">
                    <label htmlFor="gift-note" className="sr-only">
                      Gift note
                    </label>
                    <textarea
                      id="gift-note"
                      value={giftNote}
                      onChange={(e) =>
                        setGiftNote(e.target.value.slice(0, 300))
                      }
                      rows={3}
                      placeholder="We'll handwrite this note and tuck it into your parcel."
                      className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none"
                    />
                    <p className="text-right text-xs text-gray-500">
                      {giftNote.length}/300
                    </p>
                  </div>
                )}
              </div>

              <Button
                size="lg"
                fullWidth
                className="rounded-xl text-base"
                onClick={pay}
                loading={paying}
                disabled={
                  !summary?.canPay || !addressId || addingAddress || paying
                }
              >
                <Lock className="size-4" aria-hidden="true" />
                Pay Now{summary ? ` · ${formatINR(summary.totals.total)}` : ""}
              </Button>
              {!addressId && (
                <p className="text-center text-xs text-rose-600">
                  Add a delivery address to continue.
                </p>
              )}
              <p className="text-center text-xs text-gray-500">
                By clicking Pay Now, you agree to our{" "}
                <Link href="/terms" className="underline">
                  Terms
                </Link>{" "}
                &amp;{" "}
                <Link href="/shipping-policy" className="underline">
                  Shipping Policy
                </Link>
                .
              </p>
            </div>
          )}
        </Step>
      </div>

      {/* Order summary */}
      <aside
        aria-label="Order summary"
        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 lg:sticky lg:top-6"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
          {lines.length > 0 && (
            <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-semibold text-brand">
              {lines.reduce((s, l) => s + l.quantity, 0)} items
            </span>
          )}
        </div>
        {!summary ? (
          <div className="mt-4 flex flex-col gap-3" aria-busy="true">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-100">
              {lines.map((l) => (
                <li
                  key={`${l.productId}:${l.variantId}`}
                  className="flex items-center gap-4 py-4"
                >
                  <span className="relative size-14 shrink-0">
                    <Image
                      src={imageUrl(l.image) ?? PLACEHOLDER_IMAGE}
                      alt=""
                      fill
                      sizes="56px"
                      className="rounded-lg object-cover"
                    />
                    <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                      {l.quantity}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block font-semibold text-gray-900">
                      {l.name}
                    </span>
                    {l.variantLabel && (
                      <span className="block text-xs text-gray-500">
                        {l.variantLabel}
                      </span>
                    )}
                    {l.problem && (
                      <span className="mt-1 flex items-center gap-1 text-xs text-rose-600">
                        <AlertCircle className="size-3" aria-hidden="true" />
                        {l.problem === "low_stock"
                          ? `Only ${l.stock} left`
                          : l.problem === "out_of_stock"
                            ? "Sold out"
                            : "Unavailable"}
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatINR(l.unitPrice * l.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            {!summary.canPay && lines.length > 0 && (
              <p className="mb-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                Some items can&apos;t be bought right now.{" "}
                <Link href="/cart" className="font-semibold underline">
                  Review your cart
                </Link>
                .
              </p>
            )}

            {/* Coupon */}
            {summary.coupon.applied ? (
              <p className="flex items-center justify-between rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                <span className="flex items-center gap-2">
                  <Check className="size-4" aria-hidden="true" />{" "}
                  {summary.coupon.message}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCouponCode(null);
                    setCouponInput("");
                  }}
                  aria-label="Remove coupon"
                  className="text-emerald-800"
                >
                  <X className="size-4" />
                </button>
              </p>
            ) : (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  applyCoupon();
                }}
              >
                <label className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 focus-within:border-brand">
                  <Tag className="size-4 text-gray-400" aria-hidden="true" />
                  <span className="sr-only">Discount code</span>
                  <input
                    value={couponInput}
                    onChange={(e) =>
                      setCouponInput(e.target.value.toUpperCase())
                    }
                    placeholder="Discount code or gift card"
                    maxLength={30}
                    className="w-full py-2.5 text-sm uppercase placeholder:normal-case focus:outline-none"
                  />
                </label>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={!couponInput.trim()}
                >
                  Apply
                </Button>
              </form>
            )}
            {!summary.coupon.applied && summary.coupon.message && (
              <p className="mt-2 text-xs text-rose-600" role="alert">
                {summary.coupon.message}
              </p>
            )}

            <dl className="mt-5 flex flex-col gap-2 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Subtotal</dt>
                <dd>{formatINR(summary.totals.subtotal)}</dd>
              </div>
              {summary.totals.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Discount</dt>
                  <dd>−{formatINR(summary.totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-600">Shipping</dt>
                <dd
                  className={
                    summary.totals.shipping
                      ? ""
                      : "font-semibold text-emerald-600"
                  }
                >
                  {summary.totals.shipping
                    ? formatINR(summary.totals.shipping)
                    : "FREE"}
                </dd>
              </div>
              <div className="mt-3 flex items-end justify-between border-t border-gray-100 pt-4">
                <dt className="text-base font-bold text-gray-900">Total</dt>
                <dd className="text-right">
                  <span className="block text-2xl font-bold text-[#210023]">
                    {formatINR(summary.totals.total)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Including {formatINR(summary.totals.gstIncluded)} in taxes
                  </span>
                </dd>
              </div>
            </dl>
          </>
        )}
        <ul className="mt-6 flex flex-col gap-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
          <li className="flex items-center gap-3">
            <ShieldCheck className="size-4 text-brand" aria-hidden="true" />{" "}
            100% handcrafted, quality checked
          </li>
          <li className="flex items-center gap-3">
            <Clock className="size-4 text-brand" aria-hidden="true" />{" "}
            Dispatched within 24–48 hours across India
          </li>
          <li className="flex items-center gap-3">
            <LifeBuoy className="size-4 text-brand" aria-hidden="true" />
            <span>
              Need help?{" "}
              <Link href="/contact" className="font-semibold text-brand">
                Contact us
              </Link>
            </span>
          </li>
        </ul>
      </aside>
    </div>
  );
}

function Step({
  number,
  title,
  active,
  done,
  locked,
  lockedHint,
  children,
}: {
  number: number;
  title: string;
  active?: boolean;
  done?: boolean;
  locked?: boolean;
  lockedHint?: string;
  children?: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`step-${number}`}
      className={cn(
        "rounded-2xl bg-white p-6 shadow-sm ring-1",
        locked
          ? "opacity-60 ring-gray-100"
          : active && !done
            ? "ring-2 ring-purple-200"
            : "ring-gray-100",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          !locked && "mb-5 border-b border-gray-100 pb-4",
        )}
      >
        <h2
          id={`step-${number}`}
          className="flex items-center gap-3 text-lg font-semibold text-gray-900"
        >
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-sm font-semibold",
              locked
                ? "bg-gray-100 text-gray-500"
                : done
                  ? "bg-emerald-600 text-white"
                  : "bg-brand text-white",
            )}
          >
            {done ? <Check className="size-4" aria-hidden="true" /> : number}
          </span>
          {title}
        </h2>
        {locked ? (
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Lock className="size-3" aria-hidden="true" /> {lockedHint}
          </span>
        ) : active && !done ? (
          <span className="rounded bg-brand-light px-2 py-1 text-[11px] font-semibold tracking-wide text-brand uppercase">
            Active step
          </span>
        ) : null}
      </div>
      {!locked && children}
    </section>
  );
}
