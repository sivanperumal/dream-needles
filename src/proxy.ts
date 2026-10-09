import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Everything except static files, images and the Razorpay webhook (no cookies there).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|figma/|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
