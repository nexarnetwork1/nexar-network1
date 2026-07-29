"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, Star } from "lucide-react";
import { submitStoreReviewAction } from "@/modules/marketplace/storefront/actions";
import type { StoreReview } from "@/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

type Props = {
  storeId: string;
  reviews: StoreReview[];
};

export function StorefrontReviews({ storeId, reviews }: Props) {
  return (
    <section className="space-y-6">
      <h2 className="font-heading text-xl font-semibold text-white sm:text-2xl">
        Customer reviews
      </h2>
      <ReviewForm storeId={storeId} />
      {reviews.length ? (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No reviews yet. Be the first to review this store.</p>
      )}
    </section>
  );
}

function ReviewForm({ storeId }: { storeId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="rounded-2xl border border-border/70 bg-card/30 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const fd = new FormData(e.currentTarget);
          fd.set("storeId", storeId);
          const result = await submitStoreReviewAction(fd);
          if (!result.success) setError(result.error ?? "Failed");
          else {
            setSuccess(true);
            setError(null);
            e.currentTarget.reset();
          }
        });
      }}
    >
      <p className="text-sm font-medium text-white">Write a review</p>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer">
            <input type="radio" name="rating" value={n} className="peer sr-only" required />
            <Star className="h-6 w-6 text-muted peer-checked:fill-gold peer-checked:text-gold hover:text-gold" />
          </label>
        ))}
      </div>
      <Textarea name="body" label="Your review" rows={3} className="mt-3" required />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      {success && <p className="mt-2 text-sm text-emerald-400">Review submitted</p>}
      <Button type="submit" className="mt-3" size="sm" disabled={pending}>
        Submit review
      </Button>
    </form>
  );
}

function ReviewItem({ review }: { review: StoreReview }) {
  return (
    <li className="rounded-2xl border border-border/60 bg-surface/30 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex">
            {Array.from({ length: review.rating }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-gold text-gold" />
            ))}
          </div>
          {review.is_verified_purchase && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
              <BadgeCheck className="h-3 w-3" />
              Verified purchase
            </span>
          )}
        </div>
        <time className="text-xs text-muted">
          {new Date(review.created_at).toLocaleDateString()}
        </time>
      </div>
      {review.title && <p className="mt-2 font-medium text-white">{review.title}</p>}
      <p className="mt-2 text-sm leading-relaxed text-muted">{review.body}</p>
      {review.merchant_reply && (
        <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 p-3 text-sm">
          <p className="text-xs font-medium text-gold">Merchant reply</p>
          <p className="mt-1 text-muted">{review.merchant_reply}</p>
        </div>
      )}
    </li>
  );
}
