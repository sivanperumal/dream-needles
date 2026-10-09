import { z } from "zod";
import { INDIAN_STATES } from "@/lib/india";

/** Indian mobile: 10 digits starting 6–9; accepts +91 / 0 prefixes and spaces. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) =>
    v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""),
  )
  .pipe(
    z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number."),
  );

export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode.");

const text = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required.`)
    .max(max, `${label} must be at most ${max} characters.`);

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

export const addressSchema = z.object({
  id: z
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  label: optional(40),
  full_name: text("Full name", 2, 120),
  phone: phoneSchema,
  line1: text("Address", 3, 200),
  line2: optional(200),
  landmark: optional(120),
  city: text("City", 2, 80),
  state: z.enum(INDIAN_STATES, { message: "Choose your state." }),
  pincode: pincodeSchema,
  is_default: z
    .union([z.literal("on"), z.literal("true"), z.boolean()])
    .optional()
    .transform((v) => v === true || v === "on" || v === "true"),
});

export type AddressInput = z.input<typeof addressSchema>;
export type Address = z.output<typeof addressSchema>;

export const profileSchema = z.object({
  full_name: text("Name", 2, 120),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined)
    .pipe(phoneSchema.optional()),
});

/** First error message per field, for showing next to inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
