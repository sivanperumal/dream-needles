import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { emailEnv, type EmailEnv } from "@/lib/env";

/**
 * Sends email over SMTP with Nodemailer. Works with Gmail (default), Resend,
 * Brevo or any SMTP server — switch by changing the SMTP_* env vars only.
 *
 * Never throws: email is a side effect, so a missing configuration or a
 * failing SMTP server is logged and reported, but never breaks an order.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SendResult =
  | { status: "sent"; messageId: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

let cached: { key: string; transporter: Transporter } | null = null;

function transporterFor(env: EmailEnv): Transporter {
  const key = `${env.SMTP_HOST}:${env.SMTP_PORT}:${env.SMTP_USER}`;
  if (cached?.key !== key) {
    cached = {
      key,
      transporter: nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        // 465 = TLS from the start (Gmail, Resend); 587 = STARTTLS (Brevo).
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      }),
    };
  }
  return cached.transporter;
}

/** Reserved test domains (RFC 2606/6761) never receive real email. */
const RESERVED_DOMAIN = /\.(test|example|invalid|localhost)$/i;

export function isEmailConfigured(): boolean {
  return emailEnv() !== null;
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  if (RESERVED_DOMAIN.test(message.to.split("@")[1] ?? "")) {
    return { status: "skipped", reason: "reserved test domain" };
  }
  const env = emailEnv();
  if (!env) {
    console.warn(
      `[email] SMTP not configured; skipped "${message.subject}" to ${message.to}`,
    );
    return { status: "skipped", reason: "SMTP not configured" };
  }
  try {
    const info = await transporterFor(env).sendMail({
      from: env.EMAIL_FROM,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    return { status: "sent", messageId: info.messageId };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(
      `[email] Failed to send "${message.subject}" to ${message.to}: ${reason}`,
    );
    return { status: "failed", error: reason };
  }
}
