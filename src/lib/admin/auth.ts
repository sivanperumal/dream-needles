import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side admin check for pages and actions. The proxy already redirects
 * non-admins, and RLS (is_admin()) blocks writes regardless; this is the
 * third layer so a missing check can never expose admin data.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  const profile = await getProfile();
  if (profile?.role !== "admin") redirect("/");
  return { user, profile, supabase: await createClient() };
}

/** For server actions: returns an error instead of redirecting. */
export async function adminOrError() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      error: "Your session has expired. Please sign in again." as const,
    };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return { error: "Only admins can do this." as const };
  return { supabase, user };
}

export type ActionResult = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  id?: string;
};
