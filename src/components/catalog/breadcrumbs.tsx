import { Home } from "lucide-react";
import Link from "next/link";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[13px] text-gray-600">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li className="flex items-center gap-1">
          <Home className="size-3.5" aria-hidden="true" />
          <Link href="/" className="hover:text-brand">
            Home
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={item.label + i} className="flex items-center gap-1.5">
            <span className="text-gray-300" aria-hidden="true">
              /
            </span>
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="hover:text-brand">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-900" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
