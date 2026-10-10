import "server-only";
import { publicEnv } from "@/lib/env";
import type { EmailMessage } from "./mailer";

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

export type ContactMessage = {
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
};

/**
 * Notification to the store's support inbox for a Contact Us message.
 * "Reply" in the mail app answers the customer directly (Reply-To).
 */
export function buildContactEmail(
  contact: ContactMessage,
  to: string,
): EmailMessage {
  const site = publicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const rows: [string, string][] = [
    ["Name", contact.name],
    ["Email", contact.email],
    ...(contact.phone ? [["Phone", contact.phone] as [string, string]] : []),
    ["Topic", contact.subject],
  ];
  const html = `<div style="margin:0;padding:24px 16px;background:#f8ebf9;font-family:Arial,Helvetica,sans-serif;color:#374151;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px;">
    <p style="margin:0 0 4px;font-size:18px;font-weight:bold;color:#4d0851;">New Contact Us message</p>
    <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">Reply to this email to answer ${escapeHtml(contact.name)} directly.</p>
    <table role="presentation" style="border-collapse:collapse;font-size:14px;">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="padding:4px 16px 4px 0;color:#6b7280;">${label}</td><td style="padding:4px 0;color:#111827;font-weight:bold;">${escapeHtml(value)}</td></tr>`,
        )
        .join("")}
    </table>
    <div style="margin-top:20px;padding:16px;background:#f0f3ff;border-radius:12px;font-size:14px;line-height:22px;white-space:pre-line;">${escapeHtml(contact.message)}</div>
    <p style="margin:20px 0 0;font-size:12px;color:#6b7280;">All messages: <a href="${site}/admin/contact" style="color:#4d0851;">Admin → Contact messages</a></p>
  </div>
</div>`;
  const text = [
    "New Contact Us message",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    contact.message,
    "",
    `All messages: ${site}/admin/contact`,
  ].join("\n");
  return {
    to,
    replyTo: `${contact.name.replace(/[<>"\r\n]/g, "")} <${contact.email}>`,
    subject: `Contact Us: ${contact.subject} (from ${contact.name.replace(/[\r\n]/g, " ")})`,
    html,
    text,
  };
}
