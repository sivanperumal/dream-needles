import "server-only";
import Razorpay from "razorpay";
import { publicEnv, serverEnv } from "@/lib/env";

let client: Razorpay | null = null;

/** Razorpay SDK client (server only). Throws a clear error if keys are missing. */
export function razorpay(): Razorpay {
  const keyId = publicEnv().NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = serverEnv().RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay keys are missing: set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (SETUP.md Part 4).",
    );
  }
  client ??= new Razorpay({ key_id: keyId, key_secret: keySecret });
  return client;
}
