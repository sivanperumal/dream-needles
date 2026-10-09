import type { NextRequest } from "next/server";
import { z } from "zod";
import { searchPopup } from "@/lib/queries/search";

const querySchema = z.string().trim().min(2).max(64);

/** GET /api/search?q=crochet → live-search popup results (see lib/queries/search.ts). */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(
    request.nextUrl.searchParams.get("q") ?? "",
  );
  if (!parsed.success) {
    return Response.json({
      collections: [],
      products: [],
      total: 0,
      suggestions: [],
    });
  }
  try {
    const result = await searchPopup(parsed.data);
    return Response.json(result, {
      headers: { "Cache-Control": "public, max-age=30, s-maxage=30" },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Search is unavailable right now." },
      { status: 503 },
    );
  }
}
