import { z } from "zod";

/**
 * Environment variables, validated on first use so a missing key fails with a
 * clear message instead of a confusing runtime error deep inside a request.
 * NEXT_PUBLIC_* values are inlined into the browser bundle by Next.js, so they
 * must be read with literal `process.env.NAME` expressions.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
});

export type PublicEnv = z.infer<typeof publicSchema>;

let cachedPublic: PublicEnv | undefined;

export function publicEnv(): PublicEnv {
  cachedPublic ??= parse(publicSchema, {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_RAZORPAY_KEY_ID:
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || undefined,
  });
  return cachedPublic;
}

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  GOOGLE_SHEETS_WEBHOOK_URL: z.url().optional(),
  GOOGLE_SHEETS_SECRET: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

/** Server-only secrets. Never import the result into client components. */
export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() was called in the browser");
  }
  return parse(serverSchema, {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || undefined,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || undefined,
    GOOGLE_SHEETS_WEBHOOK_URL:
      process.env.GOOGLE_SHEETS_WEBHOOK_URL || undefined,
    GOOGLE_SHEETS_SECRET: process.env.GOOGLE_SHEETS_SECRET || undefined,
  });
}

const emailSchema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  EMAIL_FROM: z.string().min(3),
});

export type EmailEnv = z.infer<typeof emailSchema>;

/**
 * SMTP settings for order emails (Gmail by default; Resend or Brevo work by
 * changing these values only). Returns null when email isn't configured, so
 * callers skip sending instead of failing the order.
 */
export function emailEnv(): EmailEnv | null {
  const values = {
    SMTP_HOST: process.env.SMTP_HOST || undefined,
    SMTP_PORT: process.env.SMTP_PORT || undefined,
    SMTP_USER: process.env.SMTP_USER || undefined,
    SMTP_PASS: process.env.SMTP_PASS || undefined,
    EMAIL_FROM: process.env.EMAIL_FROM || undefined,
  };
  if (Object.values(values).every((v) => v === undefined)) return null;
  const result = emailSchema.safeParse(values);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    console.warn(
      `[email] SMTP is partly configured; check: ${missing}. Emails will be skipped.`,
    );
    return null;
  }
  return result.data;
}

function parse<T extends z.ZodType>(schema: T, values: unknown): z.infer<T> {
  const result = schema.safeParse(values);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(
      `Missing or invalid environment variables: ${missing}. See .env.example.`,
    );
  }
  return result.data;
}

/**
 * True once the Supabase keys are in .env.local. Until then the storefront
 * runs in "preview mode" with seed navigation (see lib/queries/preview.ts).
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
