import { z } from "zod";

export const CONTACT_TOPICS = [
  "Order & delivery",
  "Product question",
  "Custom order",
  "Returns & refunds",
  "Wholesale enquiry",
  "Something else",
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .pipe(z.email("Please enter a valid email address.")),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => v || null),
  subject: z.enum(CONTACT_TOPICS, { message: "Please choose a topic." }),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters.")
    .max(500, "Please keep it under 500 characters."),
  /** Honeypot: hidden from people, bots fill it in. */
  website: z.string().max(0).optional(),
});

export type ContactInput = z.output<typeof contactSchema>;
