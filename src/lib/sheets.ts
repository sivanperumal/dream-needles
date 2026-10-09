import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * Appends a Contact Us submission to the Google Sheet via the Apps Script web
 * app in google-apps-script/contact.gs (shared secret, server-side only).
 */
export async function appendContactRow(row: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { GOOGLE_SHEETS_WEBHOOK_URL: url, GOOGLE_SHEETS_SECRET: secret } =
    serverEnv();
  if (!url || !secret)
    return { ok: false, error: "Google Sheets is not configured" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids a CORS preflight on Apps Script
      body: JSON.stringify({ ...row, secret }),
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;
    return body?.ok
      ? { ok: true }
      : { ok: false, error: body?.error ?? `HTTP ${res.status}` };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}
