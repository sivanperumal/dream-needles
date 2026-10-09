"use client";

import { Home, MapPin, Pencil, Phone, Plus, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldError, Input, Label } from "@/components/ui/input";
import {
  deleteAddress,
  type FormState,
  setDefaultAddress,
  updateProfile,
} from "@/lib/actions/account";
import { cn } from "@/lib/utils";
import { AddressForm, type AddressValues } from "./address-form";

const TABS = [
  { href: "/account", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
];

export function AccountTabs() {
  const pathname = usePathname();
  return <AccountTabsList pathname={pathname} />;
}

export function AccountTabsList({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto">
      {TABS.map((t) => {
        const active =
          t.href === "/account"
            ? pathname === "/account"
            : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-brand text-white"
                : "text-gray-700 hover:bg-brand-tint hover:text-brand",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** "Edit Profile" button + modal (Figma 79:10013). */
export function EditProfileButton({
  fullName,
  phone,
}: {
  fullName: string;
  phone: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: FormState, formData: FormData) => {
      const result = await updateProfile(prev, formData);
      if (result?.ok) {
        toast.success(result.message);
        setOpen(false);
      }
      return result;
    },
    null,
  );
  return (
    <>
      <Button variant="secondary" fullWidth onClick={() => setOpen(true)}>
        <Pencil className="size-3.5" aria-hidden="true" /> Edit Profile
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Edit profile">
        <form action={action} className="flex flex-col gap-4 p-5" noValidate>
          <div>
            <Label htmlFor="profile-name">Full name</Label>
            <Input
              id="profile-name"
              name="full_name"
              defaultValue={fullName}
              autoComplete="name"
              required
              aria-invalid={state?.errors?.full_name ? true : undefined}
            />
            <FieldError>{state?.errors?.full_name}</FieldError>
          </div>
          <div>
            <Label htmlFor="profile-phone">Mobile number (optional)</Label>
            <Input
              id="profile-phone"
              name="phone"
              defaultValue={phone}
              inputMode="tel"
              autoComplete="tel"
              aria-invalid={state?.errors?.phone ? true : undefined}
            />
            <FieldError>{state?.errors?.phone}</FieldError>
          </div>
          <p className="text-xs text-gray-500">
            Your email is used to sign in and can&apos;t be changed here.
          </p>
          {state?.message && !state.ok && (
            <p className="text-sm text-rose-600">{state.message}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save changes
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export type AddressRow = Required<
  Omit<AddressValues, "line2" | "landmark" | "label">
> & {
  id: string;
  line2: string | null;
  landmark: string | null;
  label: string | null;
};

/** Address grid with add / edit / delete / set default. */
export function AddressBook({ addresses }: { addresses: AddressRow[] }) {
  const [editing, setEditing] = useState<AddressRow | "new" | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<FormState>) =>
    startTransition(async () => {
      const result = await fn();
      if (result?.ok) toast.success(result.message);
      else toast.error(result?.message ?? "Something went wrong.");
    });

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {addresses.length} saved{" "}
          {addresses.length === 1 ? "address" : "addresses"}
        </p>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="size-4" aria-hidden="true" /> Add address
        </Button>
      </div>
      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-purple-200 bg-white p-10 text-center">
          <MapPin
            className="mx-auto size-8 text-purple-300"
            aria-hidden="true"
          />
          <p className="mt-3 font-semibold text-gray-900">
            No saved addresses yet
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Add one now to make checkout faster.
          </p>
        </div>
      ) : (
        <ul
          className={cn("grid gap-4 md:grid-cols-2", pending && "opacity-60")}
        >
          {addresses.map((a) => (
            <li
              key={a.id}
              className="flex flex-col rounded-2xl bg-[#f0f3ff] p-5"
            >
              <div className="flex items-center justify-between">
                {a.is_default ? (
                  <span className="flex items-center gap-1 rounded bg-pink-100 px-2 py-0.5 text-xs font-semibold text-brand">
                    <Star className="size-3" aria-hidden="true" /> Default
                    address
                  </span>
                ) : (
                  <span className="rounded bg-white px-2 py-0.5 text-xs font-medium text-gray-600">
                    {a.label || "Address"}
                  </span>
                )}
                <Home className="size-4 text-gray-500" aria-hidden="true" />
              </div>
              <p className="mt-3 text-lg font-semibold text-gray-900">
                {a.full_name}
              </p>
              <address className="mt-1 text-sm leading-6 text-gray-600 not-italic">
                {a.line1}
                {a.line2 && <>, {a.line2}</>}
                <br />
                {a.landmark && (
                  <>
                    Near {a.landmark}
                    <br />
                  </>
                )}
                {a.city}, {a.state} – {a.pincode}
              </address>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                <Phone className="size-3.5" aria-hidden="true" /> {a.phone}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => setEditing(a)}
                  className="flex items-center gap-1 font-semibold text-brand hover:underline"
                >
                  <Pencil className="size-3.5" aria-hidden="true" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    window.confirm("Delete this address?") &&
                    run(() => deleteAddress(a.id))
                  }
                  className="flex items-center gap-1 text-rose-600 hover:underline"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" /> Delete
                </button>
                {!a.is_default && (
                  <button
                    type="button"
                    onClick={() => run(() => setDefaultAddress(a.id))}
                    className="ml-auto text-gray-700 hover:text-brand"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add a new address" : "Edit address"}
        className="max-w-2xl"
      >
        {editing !== null && (
          <AddressForm
            initial={editing === "new" ? undefined : editing}
            onSaved={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Dialog>
    </>
  );
}
