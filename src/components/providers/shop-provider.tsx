"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/lib/env";
import { readLocal, STORAGE_KEYS, writeLocal } from "@/lib/stores/local";
import { createClient } from "@/lib/supabase/client";
import { useUI } from "./ui-provider";

/**
 * Cart, wishlist and recently-viewed state for the storefront.
 *  - Guests: stored in localStorage.
 *  - Signed in: stored in Supabase (cart_items / wishlist_items, RLS: own rows
 *    only). On sign-in the guest cart and wishlist are merged into the account
 *    (quantities added, capped at 99) and the local copies are cleared.
 * Updates are optimistic: the UI changes at once, the database write follows.
 */

export type CartLine = {
  productId: string;
  variantId: string | null;
  quantity: number;
};
export type ShopUser = { id: string; email: string | null };

type ShopState = {
  ready: boolean;
  user: ShopUser | null;
  cart: CartLine[];
  wishlist: string[];
  recentlyViewed: string[];
  addToCart: (line: CartLine, options?: { silent?: boolean }) => void;
  setQuantity: (
    productId: string,
    variantId: string | null,
    quantity: number,
  ) => void;
  removeFromCart: (productId: string, variantId: string | null) => void;
  clearCart: () => void;
  reloadCart: () => Promise<void>;
  syncSession: () => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string, name?: string) => void;
  markViewed: (productId: string) => void;
};

const ShopContext = createContext<ShopState | null>(null);
const MAX_QTY = 99;
const sameLine = (
  a: { productId: string; variantId: string | null },
  productId: string,
  variantId: string | null,
) => a.productId === productId && a.variantId === variantId;

type Supabase = ReturnType<typeof createClient>;

async function loadAccount(supabase: Supabase) {
  const [cart, wishlist] = await Promise.all([
    supabase
      .from("cart_items")
      .select("product_id, variant_id, quantity")
      .order("created_at"),
    supabase
      .from("wishlist_items")
      .select("product_id")
      .order("created_at", { ascending: false }),
  ]);
  return {
    cart: (cart.data ?? []).map((r) => ({
      productId: r.product_id,
      variantId: r.variant_id,
      quantity: r.quantity,
    })),
    wishlist: (wishlist.data ?? []).map((r) => r.product_id),
  };
}

/** Writes one cart line's quantity for the signed-in user (0 deletes it). */
async function saveLine(
  supabase: Supabase,
  userId: string,
  line: CartLine,
  existed: boolean,
) {
  const match = <
    Q extends {
      eq: (c: string, v: string) => Q;
      is: (c: string, v: null) => Q;
    },
  >(
    q: Q,
  ) =>
    line.variantId
      ? q.eq("product_id", line.productId).eq("variant_id", line.variantId)
      : q.eq("product_id", line.productId).is("variant_id", null);
  if (line.quantity <= 0)
    return match(supabase.from("cart_items").delete().eq("user_id", userId));
  if (existed)
    return match(
      supabase
        .from("cart_items")
        .update({ quantity: line.quantity })
        .eq("user_id", userId),
    );
  return supabase.from("cart_items").insert({
    user_id: userId,
    product_id: line.productId,
    variant_id: line.variantId,
    quantity: line.quantity,
  });
}

/** Merges the guest (localStorage) cart and wishlist into the account, then returns the account state. */
async function mergeGuestIntoAccount(client: Supabase, userId: string) {
  const guestCart = readLocal<CartLine[]>(STORAGE_KEYS.cart, []);
  const guestWishlist = readLocal<string[]>(STORAGE_KEYS.wishlist, []);
  let account = await loadAccount(client);
  if (guestCart.length || guestWishlist.length) {
    await Promise.all([
      ...guestCart.map((line) => {
        const existing = account.cart.find((l) =>
          sameLine(l, line.productId, line.variantId),
        );
        const quantity = Math.min(
          MAX_QTY,
          (existing?.quantity ?? 0) + line.quantity,
        );
        return saveLine(
          client,
          userId,
          { ...line, quantity },
          Boolean(existing),
        );
      }),
      guestWishlist.length
        ? client.from("wishlist_items").upsert(
            guestWishlist.map((product_id) => ({
              user_id: userId,
              product_id,
            })),
            {
              onConflict: "user_id,product_id",
              ignoreDuplicates: true,
            },
          )
        : Promise.resolve(),
    ]);
    writeLocal(STORAGE_KEYS.cart, []);
    writeLocal(STORAGE_KEYS.wishlist, []);
    account = await loadAccount(client);
  }
  return account;
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const { setCounts, open } = useUI();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<ShopUser | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const supabaseRef = useRef<Supabase | null>(null);
  const userRef = useRef<ShopUser | null>(null);
  // Latest cart for event handlers (avoids stale closures in addToCart).
  const cartRef = useRef<CartLine[]>([]);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const supabase = () => (supabaseRef.current ??= createClient());

  const reportError = useCallback(
    (result: { error: { message: string } | null } | undefined) => {
      if (result?.error)
        toast.error("Couldn't save that change. Please refresh and try again.");
    },
    [],
  );

  // Guest state first; then follow the Supabase session.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrating from localStorage after mount */
    setCart(readLocal<CartLine[]>(STORAGE_KEYS.cart, []));
    setWishlist(readLocal<string[]>(STORAGE_KEYS.wishlist, []));
    setRecentlyViewed(readLocal<string[]>(STORAGE_KEYS.recentlyViewed, []));
    /* eslint-enable react-hooks/set-state-in-effect */
    if (!isSupabaseConfigured()) {
      setReady(true);
      return;
    }

    const client = supabase();
    const { data } = client.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user
        ? { id: session.user.id, email: session.user.email ?? null }
        : null;
      const previous = userRef.current;
      userRef.current = nextUser;
      setUser(nextUser);

      if (!nextUser) {
        if (previous) {
          // Signed out: start an empty guest cart/wishlist.
          setCart([]);
          setWishlist([]);
        }
        setReady(true);
        return;
      }
      if (previous?.id === nextUser.id && event !== "INITIAL_SESSION") return;

      // Defer DB calls out of the auth callback (Supabase recommends this).
      setTimeout(async () => {
        const account = await mergeGuestIntoAccount(client, nextUser.id);
        setCart(account.cart);
        setWishlist(account.wishlist);
        setReady(true);
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Persist guest state; keep header counts in sync.
  useEffect(() => {
    if (!ready) return;
    if (!user) writeLocal(STORAGE_KEYS.cart, cart);
    setCounts({ cart: cart.reduce((sum, l) => sum + l.quantity, 0) });
  }, [cart, ready, user, setCounts]);

  useEffect(() => {
    if (!ready) return;
    if (!user) writeLocal(STORAGE_KEYS.wishlist, wishlist);
    setCounts({ wishlist: wishlist.length });
  }, [wishlist, ready, user, setCounts]);

  useEffect(() => {
    if (ready) writeLocal(STORAGE_KEYS.recentlyViewed, recentlyViewed);
  }, [recentlyViewed, ready]);

  const writeLine = useCallback(
    (line: CartLine, existed: boolean) => {
      const u = userRef.current;
      if (u) void saveLine(supabase(), u.id, line, existed).then(reportError);
    },
    [reportError],
  );

  const addToCart = useCallback(
    (line: CartLine, options?: { silent?: boolean }) => {
      const existing = cartRef.current.find((l) =>
        sameLine(l, line.productId, line.variantId),
      );
      const quantity = Math.min(
        MAX_QTY,
        (existing?.quantity ?? 0) + line.quantity,
      );
      setCart((current) =>
        existing
          ? current.map((l) =>
              sameLine(l, line.productId, line.variantId)
                ? { ...l, quantity }
                : l,
            )
          : [...current, { ...line, quantity }],
      );
      writeLine({ ...line, quantity }, Boolean(existing));
      if (!options?.silent) {
        toast.success("Added to your cart", {
          action: { label: "View cart", onClick: () => open("cart") },
        });
      }
    },
    [open, writeLine],
  );

  const setQuantity = useCallback(
    (productId: string, variantId: string | null, quantity: number) => {
      const q = Math.min(MAX_QTY, Math.max(0, quantity));
      setCart((current) =>
        q === 0
          ? current.filter((l) => !sameLine(l, productId, variantId))
          : current.map((l) =>
              sameLine(l, productId, variantId) ? { ...l, quantity: q } : l,
            ),
      );
      writeLine({ productId, variantId, quantity: q }, true);
    },
    [writeLine],
  );

  const removeFromCart = useCallback(
    (productId: string, variantId: string | null) =>
      setQuantity(productId, variantId, 0),
    [setQuantity],
  );

  const clearCart = useCallback(() => {
    setCart([]);
    const u = userRef.current;
    if (u)
      void supabase()
        .from("cart_items")
        .delete()
        .eq("user_id", u.id)
        .then(reportError);
  }, [reportError]);

  /**
   * Picks up a session that was created on the server (e.g. signing in on the
   * checkout page) without a page reload, merging the guest cart first.
   */
  const syncSession = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const client = supabase();
    const {
      data: { session },
    } = await client.auth.getSession();
    const sessionUser = session?.user;
    if (!sessionUser || sessionUser.id === userRef.current?.id) return;
    const nextUser = { id: sessionUser.id, email: sessionUser.email ?? null };
    userRef.current = nextUser;
    setUser(nextUser);
    const account = await mergeGuestIntoAccount(client, nextUser.id);
    setCart(account.cart);
    setWishlist(account.wishlist);
    setReady(true);
  }, []);

  const reloadCart = useCallback(async () => {
    if (!userRef.current) return;
    const account = await loadAccount(supabase());
    setCart(account.cart);
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist],
  );

  const toggleWishlist = useCallback(
    (productId: string, name?: string) => {
      const has = wishlist.includes(productId);
      setWishlist((current) =>
        current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [productId, ...current],
      );
      const u = userRef.current;
      if (u) {
        const table = supabase().from("wishlist_items");
        void (
          has
            ? table.delete().eq("user_id", u.id).eq("product_id", productId)
            : table.insert({ user_id: u.id, product_id: productId })
        ).then(reportError);
      }
      toast(has ? "Removed from wishlist" : "Saved to your wishlist", {
        description: name,
      });
    },
    [wishlist, reportError],
  );

  const markViewed = useCallback((productId: string) => {
    setRecentlyViewed((current) =>
      [productId, ...current.filter((id) => id !== productId)].slice(0, 12),
    );
  }, []);

  const value = useMemo(
    () => ({
      ready,
      user,
      cart,
      wishlist,
      recentlyViewed,
      addToCart,
      setQuantity,
      removeFromCart,
      clearCart,
      reloadCart,
      syncSession,
      isWishlisted,
      toggleWishlist,
      markViewed,
    }),
    [
      ready,
      user,
      cart,
      wishlist,
      recentlyViewed,
      addToCart,
      setQuantity,
      removeFromCart,
      clearCart,
      reloadCart,
      syncSession,
      isWishlisted,
      toggleWishlist,
      markViewed,
    ],
  );

  return <ShopContext value={value}>{children}</ShopContext>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside <ShopProvider>");
  return ctx;
}
