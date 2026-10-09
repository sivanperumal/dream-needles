"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  addressSchema,
  fieldErrors,
  profileSchema,
} from "@/lib/validation/account";

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
} | null;

async function signedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const NOT_SIGNED_IN: FormState = {
  ok: false,
  message: "Your session has expired. Please sign in again.",
};

export async function updateProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { supabase, user } = await signedIn();
  if (!user) return NOT_SIGNED_IN;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone ?? null,
    })
    .eq("id", user.id);
  if (error)
    return {
      ok: false,
      message: "Couldn't save your profile. Please try again.",
    };
  revalidatePath("/account", "layout");
  return { ok: true, message: "Profile updated." };
}

/** Creates or updates an address. The first address, or one marked default, becomes the default. */
export async function saveAddress(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { supabase, user } = await signedIn();
  if (!user) return NOT_SIGNED_IN;

  const { id, ...address } = parsed.data;
  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const makeDefault = address.is_default || !count;

  // Only one default per user (a unique index enforces it): clear the old one first.
  if (makeDefault) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .eq("is_default", true);
  }
  const row = { ...address, is_default: makeDefault, user_id: user.id };
  const { error } = id
    ? await supabase
        .from("addresses")
        .update(row)
        .eq("id", id)
        .eq("user_id", user.id)
    : await supabase.from("addresses").insert(row);
  if (error)
    return {
      ok: false,
      message:
        "Couldn't save this address. Please check the details and try again.",
    };

  revalidatePath("/account", "layout");
  revalidatePath("/checkout");
  return { ok: true, message: id ? "Address updated." : "Address added." };
}

const idSchema = z.uuid();

export async function deleteAddress(id: string): Promise<FormState> {
  if (!idSchema.safeParse(id).success)
    return { ok: false, message: "Invalid address." };
  const { supabase, user } = await signedIn();
  if (!user) return NOT_SIGNED_IN;

  const { data: removed } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("is_default")
    .single();
  // If the default was removed, promote the most recent remaining address.
  if (removed?.is_default) {
    const { data: next } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (next)
      await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", next.id);
  }
  revalidatePath("/account", "layout");
  return { ok: true, message: "Address removed." };
}

export async function setDefaultAddress(id: string): Promise<FormState> {
  if (!idSchema.safeParse(id).success)
    return { ok: false, message: "Invalid address." };
  const { supabase, user } = await signedIn();
  if (!user) return NOT_SIGNED_IN;

  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", user.id)
    .eq("is_default", true);
  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error)
    return { ok: false, message: "Couldn't change the default address." };
  revalidatePath("/account", "layout");
  return { ok: true, message: "Default address updated." };
}
