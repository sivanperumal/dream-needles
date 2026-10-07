import { cn, discountPercent, formatINR } from "@/lib/utils";

type PriceProps = {
  price: number;
  compareAt?: number | null;
  size?: "sm" | "md" | "lg";
  showSaving?: boolean;
  className?: string;
};

const sizes = {
  sm: { price: "text-sm", compare: "text-xs" },
  md: { price: "text-base", compare: "text-sm" },
  lg: { price: "text-3xl", compare: "text-base" },
};

export function Price({
  price,
  compareAt,
  size = "md",
  showSaving,
  className,
}: PriceProps) {
  const saving = discountPercent(price, compareAt);
  return (
    <span
      className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}
    >
      <span className={cn("font-bold text-gray-900", sizes[size].price)}>
        {formatINR(price)}
      </span>
      {saving !== null && compareAt && (
        <>
          <span
            className={cn("text-gray-400 line-through", sizes[size].compare)}
          >
            <span className="sr-only">Was </span>
            {formatINR(compareAt)}
          </span>
          {showSaving && (
            <span
              className={cn(
                "font-semibold text-emerald-700",
                sizes[size].compare,
              )}
            >
              {saving}% off
            </span>
          )}
        </>
      )}
    </span>
  );
}
