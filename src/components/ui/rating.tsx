import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Five stars filled to the nearest half, with an accessible label. */
export function RatingStars({
  value,
  size = 12,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span
      className={cn("inline-flex", className)}
      role="img"
      aria-label={`Rated ${value.toFixed(1)} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = rounded >= n ? 1 : rounded >= n - 0.5 ? 0.5 : 0;
        return (
          <span
            key={n}
            className="relative"
            style={{ width: size, height: size }}
          >
            <Star
              className="absolute inset-0 text-amber-200"
              style={{ width: size, height: size }}
              strokeWidth={0}
              fill="currentColor"
            />
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: size * fill }}
              >
                <Star
                  className="text-amber-500"
                  style={{ width: size, height: size }}
                  strokeWidth={0}
                  fill="currentColor"
                />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
