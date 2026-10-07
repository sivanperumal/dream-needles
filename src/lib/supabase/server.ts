import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Supabase client acting as the signed-in visitor (RLS applies). Use in server
 * components, server actions and route handlers. Reads cookies, so callers
 * render at request time — keep them inside <Suspense>.
 */
export async function createClient() {
  const env = publicEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet)
              cookieStore.set(name, value, options);
          } catch {
            // Server components can't set cookies; the proxy refreshes the session instead.
          }
        },
      },
    },
  );
}
