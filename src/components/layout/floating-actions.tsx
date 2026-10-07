"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { SocialIcon } from "@/components/icons/social";

/** WhatsApp chat + back-to-top buttons (Figma 45:1715). */
export function FloatingActions({
  whatsappUrl,
}: {
  whatsappUrl: string | null;
}) {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed right-4 bottom-20 z-30 flex flex-col items-center gap-3 md:right-6 md:bottom-6">
      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="flex size-10 items-center justify-center rounded-full border border-purple-200 bg-white text-brand shadow-md transition-colors hover:bg-brand-tint"
        >
          <ArrowUp className="size-4" />
        </button>
      )}
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="flex size-12 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition-transform hover:scale-105"
        >
          <SocialIcon network="whatsapp" className="size-6" />
        </a>
      )}
    </div>
  );
}
