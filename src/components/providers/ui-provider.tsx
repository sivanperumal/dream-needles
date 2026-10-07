"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

/**
 * Which overlay is open (only one at a time) plus header badge counts.
 * Search, cart and wishlist plug in here in later phases.
 */
export type Panel = "search" | "cart" | "wishlist" | "menu";

type UIState = {
  panel: Panel | null;
  open: (panel: Panel) => void;
  close: () => void;
  cartCount: number;
  wishlistCount: number;
  setCounts: (counts: { cart?: number; wishlist?: number }) => void;
};

const UIContext = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const open = useCallback((next: Panel) => setPanel(next), []);
  const close = useCallback(() => setPanel(null), []);
  const setCounts = useCallback(
    ({ cart, wishlist }: { cart?: number; wishlist?: number }) => {
      if (cart !== undefined) setCartCount(cart);
      if (wishlist !== undefined) setWishlistCount(wishlist);
    },
    [],
  );

  const value = useMemo(
    () => ({ panel, open, close, cartCount, wishlistCount, setCounts }),
    [panel, open, close, cartCount, wishlistCount, setCounts],
  );
  return <UIContext value={value}>{children}</UIContext>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside <UIProvider>");
  return ctx;
}
