import Link from "next/link";
import { ConfirmButton } from "@/components/admin/confirm-button";
import {
  Card,
  EmptyRow,
  PageHeader,
  Pill,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";
import { RatingStars } from "@/components/ui/rating";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteReview, setReviewHidden } from "@/lib/admin/actions/content";

export const metadata = { title: "Reviews" };
const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function ReviewsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("reviews")
    .select(
      "id, rating, title, body, author_name, is_hidden, created_at, products (name, slug)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  return (
    <>
      <PageHeader
        title="Reviews"
        description="Reviews publish immediately. Hide anything inappropriate; hidden reviews don't count towards ratings."
      />
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Review</Th>
              <Th>Product</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((r) => (
              <tr
                key={r.id}
                className={r.is_hidden ? "bg-gray-50/60" : undefined}
              >
                <Td className="max-w-md">
                  <RatingStars value={r.rating} />
                  {r.title && (
                    <p className="font-semibold text-gray-900">{r.title}</p>
                  )}
                  <p className="line-clamp-3 text-sm text-gray-700">{r.body}</p>
                  <p className="text-xs text-gray-500">by {r.author_name}</p>
                </Td>
                <Td>
                  {r.products ? (
                    <Link
                      href={`/products/${r.products.slug}#reviews`}
                      target="_blank"
                      className="text-brand hover:underline"
                    >
                      {r.products.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td className="text-xs whitespace-nowrap">
                  {dateFmt.format(new Date(r.created_at))}
                </Td>
                <Td>
                  {r.is_hidden ? (
                    <Pill tone="red">Hidden</Pill>
                  ) : (
                    <Pill tone="green">Visible</Pill>
                  )}
                </Td>
                <Td>
                  <span className="flex justify-end gap-2">
                    <ConfirmButton
                      variant="ghost"
                      title={
                        r.is_hidden ? "Show this review?" : "Hide this review?"
                      }
                      message={
                        r.is_hidden
                          ? "It will appear on the product page again."
                          : "It will be removed from the product page and rating."
                      }
                      confirmLabel={r.is_hidden ? "Show" : "Hide"}
                      action={setReviewHidden.bind(null, r.id, !r.is_hidden)}
                    >
                      {r.is_hidden ? "Show" : "Hide"}
                    </ConfirmButton>
                    <ConfirmButton
                      variant="ghost"
                      danger
                      title="Delete this review?"
                      message="This can't be undone."
                      confirmLabel="Delete"
                      action={deleteReview.bind(null, r.id)}
                      className="text-rose-600"
                    >
                      Delete
                    </ConfirmButton>
                  </span>
                </Td>
              </tr>
            ))}
            {!data?.length && <EmptyRow colSpan={5}>No reviews yet.</EmptyRow>}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
