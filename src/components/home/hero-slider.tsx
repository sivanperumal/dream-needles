"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { imageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";

export type Slide = {
  id: string;
  title: string;
  subtitle: string;
  cta_label: string | null;
  image_path: string;
  link_url: string | null;
};

/** Home hero carousel (Figma 45:1422): rounded image, arrows, CTA, dots. Auto-advances. */
export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true });
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    const timer = setInterval(() => embla.scrollNext(), 6000);
    return () => {
      embla.off("select", onSelect);
      clearInterval(timer);
    };
  }, [embla]);

  const prev = useCallback(() => embla?.scrollPrev(), [embla]);
  const next = useCallback(() => embla?.scrollNext(), [embla]);
  const current = slides[index] ?? slides[0];
  if (!slides.length) return null;

  return (
    <div
      className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100 shadow-xl"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className="relative h-full min-w-0 flex-[0_0_100%]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}: ${slide.title}`}
            >
              <Image
                src={imageUrl(slide.image_path, "site-assets")!}
                alt={
                  slide.subtitle
                    ? `${slide.title}: ${slide.subtitle}`
                    : slide.title
                }
                fill
                priority={i === 0}
                sizes="(min-width: 1280px) 596px, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <ArrowButton side="left" onClick={prev} />
          <ArrowButton side="right" onClick={next} />
        </>
      )}

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-4 p-6 md:p-8">
        {current.link_url && (
          <Link
            href={current.link_url}
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-brand-hover"
          >
            {current.cta_label ?? `Shop ${current.title}`}
          </Link>
        )}
        {slides.length > 1 && (
          <div className="flex items-center gap-2 pt-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => embla?.scrollTo(i)}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === index ? "w-6 bg-brand" : "w-2 bg-white/80",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous slide" : "Next slide"}
      className={cn(
        "absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition-colors hover:bg-white",
        side === "left" ? "left-4" : "right-4",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
