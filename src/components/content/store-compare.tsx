"use client";

import { ChevronsLeftRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

/** Before/after slider: store front vs. interior (Figma 57:5614). Keyboard accessible range input. */
export function StoreCompare({
  outside,
  inside,
}: {
  outside: string;
  inside: string;
}) {
  const [position, setPosition] = useState(50);
  return (
    <div className="relative mx-auto mt-10 aspect-[1150/538] max-h-[538px] overflow-hidden rounded-2xl shadow-xl select-none">
      <Image
        src={inside}
        alt="Inside the store"
        fill
        sizes="(min-width: 1280px) 1150px, 100vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          src={outside}
          alt="Outside the store"
          fill
          sizes="(min-width: 1280px) 1150px, 100vw"
          className="object-cover"
        />
      </div>
      <span className="absolute top-4 left-4 rounded-full bg-brand px-3 py-1 text-[11px] font-bold text-white uppercase">
        Outside (store front)
      </span>
      <span className="absolute top-4 right-4 rounded-full bg-brand px-3 py-1 text-[11px] font-bold text-white uppercase">
        Inside (the experience)
      </span>
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white"
        style={{ left: `${position}%` }}
        aria-hidden="true"
      >
        <span className="absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white shadow-lg">
          <ChevronsLeftRight className="size-5" />
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Compare outside and inside views"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
