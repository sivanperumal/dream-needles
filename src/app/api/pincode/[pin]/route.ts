import { lookupPincode } from "@/lib/pincode";
import { getStoreSettings } from "@/lib/queries/catalog";

/** GET /api/pincode/600017 → delivery availability + estimated delivery text. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/pincode/[pin]">,
) {
  const { pin } = await params;
  const [result, settings] = await Promise.all([
    lookupPincode(pin),
    getStoreSettings(),
  ]);
  const status =
    result.valid || result.reason === "unavailable"
      ? 200
      : result.reason === "invalid"
        ? 400
        : 404;
  return Response.json(
    { ...result, eta: settings.delivery_eta_text },
    { status },
  );
}
