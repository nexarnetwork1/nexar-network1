"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { createProductReviewAction } from "@/modules/reviews/actions";
import { Button } from "@/components/ui/Button";

type ReviewFormProps = {
  productId: string;
  storeId: string;
  type?: "product" | "store";
};

export function ReviewForm({ productId, storeId }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    formData.set("productId", productId);
    formData.set("storeId", storeId);
    formData.set("rating", String(rating));

    startTransition(async () => {
      const result = await createProductReviewAction(formData);
      if (result.success) {
        toast.success("Review submitted");
      } else {
        toast.error(result.error ?? "Failed to submit review");
      }
    });
  }

  return (
    <form action={submit} className="rounded-2xl border border-border bg-card/40 p-6">
      <h3 className="font-heading text-lg font-semibold">Write a review</h3>
      <fieldset className="mt-4">
        <legend className="text-sm text-muted">Rating</legend>
        <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`p-1 ${n <= rating ? "text-amber-400" : "text-muted"}`}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={n <= rating}
            >
              <Star className={`h-6 w-6 ${n <= rating ? "fill-current" : ""}`} />
            </button>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 block">
        <span className="text-sm text-muted">Title (optional)</span>
        <input
          name="title"
          type="text"
          maxLength={120}
          className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
          placeholder="Summarize your experience"
        />
      </label>
      <label className="mt-4 block">
        <span className="text-sm text-muted">Review</span>
        <textarea
          name="body"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
          placeholder="Share details about quality, shipping, and value..."
        />
      </label>
      <label className="mt-4 block">
        <span className="text-sm text-muted">Image URLs (comma-separated, max 5)</span>
        <input
          name="images"
          type="text"
          className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
          placeholder="https://example.com/photo.jpg"
        />
      </label>
      <Button type="submit" className="mt-4" disabled={pending}>
        {pending ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
