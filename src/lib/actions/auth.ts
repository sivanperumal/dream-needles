"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

// Trim before validating: z.email() checks the raw string otherwise.
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .pipe(z.email("Please enter a valid email address."));
const codeSchema = z
  .string()
  .regex(/^\d{6}$/, "Enter the 6-digit code from your email.");

export type AuthState = {
  error?: string;
  sent?: boolean;
  email?: string;
} | null;

/** Step 1: email a 6-digit login code (creates the account on first sign-in). */
export async function sendLoginCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const next = safeNext(formData.get("next"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: true },
  });
  if (error) return { error: friendlyAuthError(error.message) };

  // Resend from the verify step, or the inline checkout form: stay on the page.
  if (formData.get("resend") === "1" || formData.get("inline") === "1")
    return { sent: true, email: parsed.data };
  redirect(
    `/login/verify?email=${encodeURIComponent(parsed.data)}&next=${encodeURIComponent(next)}`,
  );
}

/** Step 2: check the code; on success the session cookie is set. */
export async function verifyLoginCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const code = codeSchema.safeParse(formData.get("code"));
  if (!email.success)
    return { error: "Your email is missing. Please start again." };
  if (!code.success) return { error: code.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: email.data,
    token: code.data,
    type: "email",
  });
  if (error) return { error: friendlyAuthError(error.message) };
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("expired") || m.includes("invalid"))
    return "That code is wrong or has expired. Check the latest email or resend a new code.";
  if (
    m.includes("rate") ||
    m.includes("security purposes") ||
    m.includes("too many")
  )
    return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("signups not allowed"))
    return "New sign-ups are turned off. Please contact us.";
  return "Something went wrong sending your code. Please try again.";
}
