import { Search } from "lucide-react";

/** Plain GET form for the /search page (works without JavaScript). */
export function SearchBox({ defaultValue }: { defaultValue: string }) {
  return (
    <form
      action="/search"
      role="search"
      className="flex items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-sm ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-brand/30"
    >
      <Search className="size-4 shrink-0 text-gray-500" aria-hidden="true" />
      <label htmlFor="search-page-q" className="sr-only">
        Search
      </label>
      <input
        id="search-page-q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        minLength={2}
        maxLength={64}
        placeholder="Search hooks, keychains, blankets…"
        className="w-full bg-transparent py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
      >
        Search
      </button>
    </form>
  );
}
