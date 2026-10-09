import "server-only";
import { cacheLife } from "next/cache";

export type PincodeResult =
  | { valid: true; pincode: string; district: string; state: string }
  | {
      valid: false;
      pincode: string;
      reason: "invalid" | "not_found" | "unavailable";
    };

export const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;

/**
 * Looks up an Indian pincode with India Post's free API. Cached for a day.
 * If the API is down we still accept the pincode (reason "unavailable"), so
 * customers are never blocked by a third-party outage.
 */
export async function lookupPincode(pincode: string): Promise<PincodeResult> {
  "use cache";
  cacheLife("days");

  if (!PINCODE_PATTERN.test(pincode))
    return { valid: false, pincode, reason: "invalid" };
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { valid: false, pincode, reason: "unavailable" };
    const [result] = (await res.json()) as {
      Status: string;
      PostOffice: { District: string; State: string }[] | null;
    }[];
    const office =
      result?.Status === "Success" ? result.PostOffice?.[0] : undefined;
    if (!office) return { valid: false, pincode, reason: "not_found" };
    return {
      valid: true,
      pincode,
      district: office.District,
      state: office.State,
    };
  } catch {
    return { valid: false, pincode, reason: "unavailable" };
  }
}
