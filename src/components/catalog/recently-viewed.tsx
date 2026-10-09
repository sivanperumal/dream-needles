"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { useShop } from "@/components/providers/shop-provider";
import { loadProductCards } from "@/lib/actions/catalog";
import type { ProductCard as Card } from "@/lib/types";

/** "Based on your recent views" row, from localStorage (Figma cart page). */
export function RecentlyViewed({
  excludeId,
  title = "Based on Your Recent Views",
}: {
  excludeId?: string;
  title?: string;
}) {
  const { recentlyViewed, ready } = useShop();
  const [cards, setCards] = useState<Card[]>([]);
  const ids = recentlyViewed.filter((id) => id !== excludeId).slice(0, 6);
  const key = ids.join(",");

  useEffect(() => {
    if (!ready || !key) return;
    let cancelled = false;
    loadProductCards(key.split(",")).then(
      (data) => !cancelled && setCards(data),
    );
    return () => {
      cancelled = true;
    };
  }, [key, ready]);

  if (!key || !cards.length) return null;
  return (
    <section aria-labelledby="recently-viewed-heading" className="mt-16">
      <h2
        id="recently-viewed-heading"
        className="text-2xl font-bold text-[#210023] md:text-3xl"
      >
        {title}
      </h2>
      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 xl:grid-cols-6">
        {cards.map((card) => (
          <li key={card.id}>
            <ProductCard product={card} />
          </li>
        ))}
      </ul>
    </section>
  );
}
