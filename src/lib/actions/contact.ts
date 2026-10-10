"use server";

import { after } from "next/server";
import { buildContactEmail } from "@/lib/email/contact-email";
import { isReservedEmail, sendEmail } from "@/lib/email/mailer";
import { appendContactRow } from "@/lib/sheets";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors } from "@/lib/validation/account";
import { contactSchema } from "@/lib/validation/contact";

export type ContactState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
} | null;

const LIMIT = 3;
const WINDOW_MINUTES = 10;

/**
 * Contact Us: validate → save to Supabase (never lost) → copy to the Google
 * Sheet after responding. Bots are filtered with a honeypot and a per-email
 * rate limit.
 */
export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    // Honeypot tripped: pretend success so bots learn nothing.
    if (errors.website)
      return { ok: true, message: "Thanks! We'll get back to you soon." };
    return { ok: false, errors };
  }
  const { name, email, phone, subject, message } = parsed.data;
  const data = { name, email, phone, subject, message };

  const admin = createAdminClient();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { count } = await admin
    .from("contact_submissions")
    .select("id", { count: "exact", head: true })
    .eq("email", data.email)
    .gte("created_at", since);
  if ((count ?? 0) >= LIMIT) {
    return {
      ok: false,
      message:
        "You've sent a few messages already. Please wait a few minutes before sending another.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: saved, error } = await admin
    .from("contact_submissions")
    .insert({ ...data, user_id: user?.id ?? null })
    .select("id")
    .single();
  if (error || !saved)
    return {
      ok: false,
      message:
        "Sorry, we couldn't send your message. Please try again or email us.",
    };

  // Email the store's support inbox (Admin → Settings → Support email).
  after(async () => {
    if (isReservedEmail(data.email)) return; // automated test submissions
    const { data: settings } = await admin
      .from("store_settings")
      .select("contact_email")
      .eq("id", 1)
      .single();
    if (!settings?.contact_email) {
      console.warn(
        "[contact] No support email set in Admin → Settings; skipped the notification email.",
      );
      return;
    }
    const result = await sendEmail(
      buildContactEmail(data, settings.contact_email),
    );
    if (result.status === "failed")
      console.warn(
        `[contact] Notification email failed for ${saved.id}: ${result.error}`,
      );
  });

  after(async () => {
    const result = await appendContactRow({ id: saved.id, ...data });
    await admin
      .from("contact_submissions")
      .update({
        sheet_synced: result.ok,
        sheet_error: result.ok
          ? null
          : (result.error ?? "unknown error").slice(0, 500),
      })
      .eq("id", saved.id);
    if (!result.ok)
      console.warn(
        `[contact] Google Sheet sync failed for ${saved.id}: ${result.error}`,
      );
  });

  return {
    ok: true,
    message:
      "Thank you! Your message has been sent. We usually reply within 24 hours on working days.",
  };
}
