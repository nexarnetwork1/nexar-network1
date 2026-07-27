import { Star, BadgeCheck } from "lucide-react";
import type { StoreReview } from "@/types";
import { ReportButton } from "@/components/security/ReportButton";

type StoreReviewsProps = {
  reviews: StoreReview[];
  avgRating: number;
  count: number;
  storeId: string;
};

export function StoreReviews({ reviews, avgRating, count, storeId }: StoreReviewsProps) {
  return (
    <section aria-labelledby="store-reviews-heading">
      <h2 id="store-reviews-heading" className="font-heading text-xl font-semibold">
        Store Reviews
      </h2>
      {count > 0 && (
        <p className="mt-1 flex items-center gap-1 text-sm text-amber-400">
          <Star className="h-4 w-4 fill-amber-400" aria-hidden />
          {avgRating.toFixed(1)} · {count} review{count !== 1 ? "s" : ""}
        </p>
      )}

      <ul className="mt-6 space-y-4">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-2xl border border-border bg-card/40 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} />
                  {review.is_verified_purchase && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                      Verified Purchase
                    </span>
                  )}
                </div>
                {review.title && <p className="mt-2 font-medium">{review.title}</p>}
                <p className="mt-1 text-sm text-muted">{review.body}</p>
                {review.images.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {review.images.map((url) => (
                      <li key={url}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="Review photo"
                          className="h-20 w-20 rounded-lg object-cover"
                          loading="lazy"
                        />
                      </li>
                    ))}
                  </ul>
                )}
                {review.merchant_reply && (
                  <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 p-4">
                    <p className="text-xs font-semibold uppercase text-gold">Merchant reply</p>
                    <p className="mt-1 text-sm text-muted">{review.merchant_reply}</p>
                  </div>
                )}
                <p className="mt-3 text-xs text-muted">
                  {review.customer?.full_name ?? "Customer"} ·{" "}
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
              <ReportButton targetType="store_review" targetId={review.id} />
            </div>
          </li>
        ))}
        {reviews.length === 0 && (
          <li className="rounded-xl border border-border bg-surface/50 p-8 text-center text-muted">
            No store reviews yet.
          </li>
        )}
      </ul>
    </section>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted"}`}
          aria-hidden
        />
      ))}
    </span>
  );
}
