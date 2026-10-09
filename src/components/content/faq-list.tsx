"use client";

import { ChevronDown, Search } from "lucide-react";
import { useId, useState } from "react";
import { Prose } from "@/components/content/prose";
import { cn } from "@/lib/utils";

/** Searchable accordion of FAQ items (Figma 93:4367). */
export function FaqList({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(0);
  const id = useId();
  const q = query.trim().toLowerCase();
  const shown = q
    ? items.filter((i) => `${i.question} ${i.answer}`.toLowerCase().includes(q))
    : items;

  return (
    <div>
      <label className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-sm ring-1 ring-gray-100">
        <Search className="size-4 text-gray-500" aria-hidden="true" />
        <span className="sr-only">Search questions</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles, orders, shipping, care…"
          className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </label>
      <ul className="mt-6 flex flex-col gap-3">
        {shown.map((item, i) => {
          const isOpen = q ? true : open === i;
          return (
            <li
              key={item.question}
              className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100"
            >
              <h3>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  aria-controls={`${id}-${i}`}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-gray-900"
                >
                  {item.question}
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#eaeefa]">
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                  </span>
                </button>
              </h3>
              {isOpen && (
                <div id={`${id}-${i}`} className="px-5 pb-5">
                  <div className="rounded-lg bg-[#f0f3ff] p-4">
                    <Prose
                      markdown={item.answer}
                      className="text-sm leading-6 [&_p:last-child]:mb-0"
                    />
                  </div>
                </div>
              )}
            </li>
          );
        })}
        {shown.length === 0 && (
          <li className="rounded-xl bg-white p-6 text-center text-sm text-gray-600">
            No questions match &ldquo;{query}&rdquo;. Try another word, or
            contact us below.
          </li>
        )}
      </ul>
    </div>
  );
}
