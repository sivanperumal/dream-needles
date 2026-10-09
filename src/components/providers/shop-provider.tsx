"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { readLocal, STORAGE_KEYS, writeLocal } from "@/lib/stores/local";
import { useUI } from "./ui-provider";

/**
 * Cart, wishlist and recently-viewed state for the storefront.
 * Guests: kept in localStorage. Signed-in users: synced with the database
 * (wired up in the account phase); the API below stays the same.
 */

export type CartLine = {
  productId: string;
  variantId: string | null;
  quantity: number;
};

type ShopState = {
  ready: boolean;
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

export function ShopProvider({ children }: { children: ReactNode }) {
  const { setCounts, open } = useUI();
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  // Load saved state once in the browser.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrating from localStorage after mount */
    setCart(readLocal<CartLine[]>(STORAGE_KEYS.cart, []));
    setWishlist(readLocal<string[]>(STORAGE_KEYS.wishlist, []));
    setRecentlyViewed(readLocal<string[]>(STORAGE_KEYS.recentlyViewed, []));
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeLocal(STORAGE_KEYS.cart, cart);
    setCounts({ cart: cart.reduce((sum, l) => sum + l.quantity, 0) });
  }, [cart, ready, setCounts]);

  useEffect(() => {
    if (!ready) return;
    writeLocal(STORAGE_KEYS.wishlist, wishlist);
    setCounts({ wishlist: wishlist.length });
  }, [wishlist, ready, setCounts]);

  useEffect(() => {
    if (ready) writeLocal(STORAGE_KEYS.recentlyViewed, recentlyViewed);
  }, [recentlyViewed, ready]);

  const addToCart = useCallback(
    (line: CartLine, options?: { silent?: boolean }) => {
      setCart((current) => {
        const existing = current.find((l) =>
          sameLine(l, line.productId, line.variantId),
        );
        if (existing) {
          return current.map((l) =>
            l === existing
              ? {
                  ...l,
                  quantity: Math.min(MAX_QTY, l.quantity + line.quantity),
                }
              : l,
          );
        }
        return [
          ...current,
          { ...line, quantity: Math.min(MAX_QTY, line.quantity) },
        ];
      });
      if (!options?.silent) {
        toast.success("Added to your cart", {
          action: { label: "View cart", onClick: () => open("cart") },
        });
      }
    },
    [open],
  );

  const setQuantity = useCallback(
    (productId: string, variantId: string | null, quantity: number) => {
      setCart((current) =>
        quantity <= 0
          ? current.filter((l) => !sameLine(l, productId, variantId))
          : current.map((l) =>
              sameLine(l, productId, variantId)
                ? { ...l, quantity: Math.min(MAX_QTY, quantity) }
                : l,
            ),
      );
    },
    [],
  );

  const removeFromCart = useCallback(
    (productId: string, variantId: string | null) => {
      setCart((current) =>
        current.filter((l) => !sameLine(l, productId, variantId)),
      );
    },
    [],
  );

  const clearCart = useCallback(() => setCart([]), []);

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
      toast(has ? "Removed from wishlist" : "Saved to your wishlist", {
        description: name,
      });
    },
    [wishlist],
  );

  const markViewed = useCallback((productId: string) => {
    setRecentlyViewed((current) =>
      [productId, ...current.filter((id) => id !== productId)].slice(0, 12),
    );
  }, []);

  const value = useMemo(
    () => ({
      ready,
      cart,
      wishlist,
      recentlyViewed,
      addToCart,
      setQuantity,
      removeFromCart,
      clearCart,
      isWishlisted,
      toggleWishlist,
      markViewed,
    }),
    [
      ready,
      cart,
      wishlist,
      recentlyViewed,
      addToCart,
      setQuantity,
      removeFromCart,
      clearCart,
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
