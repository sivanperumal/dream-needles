import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in user (verified with Supabase Auth), once per request.
 * Reads cookies, so callers must render inside <Suspense>.
 */
export const getCurrentUser = cache(async () => {
  // Request-time only: Supabase Auth reads the clock (token expiry).
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function requireUser(next: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** The user's profile (name, phone, role). */
export const getProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, created_at")
    .eq("id", user.id)
    .single();
  return data ? { ...data, email: data.email ?? user.email ?? "" } : null;
});
