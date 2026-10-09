"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { RatingStars } from "@/components/ui/rating";
import { submitReview } from "@/lib/actions/reviews";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  author_name: string;
  created_at: string;
};

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function ReviewsSection({
  productId,
  productSlug,
  reviews,
  average,
  count,
}: {
  productId: string;
  productSlug: string;
  reviews: Review[];
  average: number;
  count: number;
}) {
  const [writing, setWriting] = useState(false);
  return (
    <section
      id="reviews"
      className="scroll-mt-28"
      aria-labelledby="reviews-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="reviews-heading"
            className="text-2xl font-bold text-[#210023] md:text-3xl"
          >
            Customer Reviews
          </h2>
          {count > 0 ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <RatingStars value={average} size={16} /> {average.toFixed(1)} out
              of 5 · {count} {count === 1 ? "review" : "reviews"}
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              No reviews yet. Be the first to share your thoughts!
            </p>
          )}
        </div>
        {!writing && (
          <Button variant="outline" onClick={() => setWriting(true)}>
            Write a review
          </Button>
        )}
      </div>

      {writing && (
        <ReviewForm
          productId={productId}
          productSlug={productSlug}
          onDone={() => setWriting(false)}
        />
      )}

      {reviews.length > 0 && (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
            >
              <div className="flex items-center justify-between gap-2">
                <RatingStars value={r.rating} size={14} />
                <time dateTime={r.created_at} className="text-xs text-gray-500">
                  {dateFormat.format(new Date(r.created_at))}
                </time>
              </div>
              {r.title && (
                <p className="mt-2 font-semibold text-gray-900">{r.title}</p>
              )}
              {r.body && (
                <p className="mt-1 text-sm leading-6 whitespace-pre-line text-gray-700">
                  {r.body}
                </p>
              )}
              <p className="mt-3 text-xs font-medium text-gray-500">
                {r.author_name}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewForm({
  productId,
  productSlug,
  onDone,
}: {
  productId: string;
  productSlug: string;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(submitReview, null);
  const [rating, setRating] = useState(5);

  if (state?.ok) {
    return (
      <p
        className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
        role="status"
      >
        {state.message}
      </p>
    );
  }

  return (
    <form
      action={action}
      className="mt-6 grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 md:max-w-2xl"
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="productSlug" value={productSlug} />
      <input type="hidden" name="rating" value={rating} />
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-gray-700">
          Your rating
        </legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
            >
              <Star
                className={cn(
                  "size-7",
                  n <= rating
                    ? "fill-amber-500 text-amber-500"
                    : "text-gray-300",
                )}
              />
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <Label htmlFor="review-title">Title (optional)</Label>
        <Input id="review-title" name="title" maxLength={120} />
      </div>
      <div>
        <Label htmlFor="review-body">Your review</Label>
        <Textarea
          id="review-body"
          name="body"
          required
          minLength={5}
          maxLength={2000}
          aria-invalid={state?.ok === false || undefined}
          aria-describedby="review-error"
        />
        <FieldError id="review-error">
          {state?.ok === false ? state.message : undefined}
        </FieldError>
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={pending}>
          Submit review
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
      {state?.ok === false && state.message.includes("sign in") && (
        <a
          href={`/login?next=/products/${productSlug}`}
          className="text-sm font-semibold text-brand hover:underline"
        >
          Sign in to review →
        </a>
      )}
    </form>
  );
}
