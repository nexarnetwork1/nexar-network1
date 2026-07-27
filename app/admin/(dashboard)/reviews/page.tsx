import Link from "next/link";
import { requireSuperAdmin } from "@/modules/users/repository";
import { getAllReviewsForModeration } from "@/modules/reviews/repository";
import { moderateReviewAction } from "@/modules/reviews/actions";
import { Button } from "@/components/ui/Button";

async function approveReview(formData: FormData) {
  "use server";
  await moderateReviewAction(formData);
}

async function rejectReview(formData: FormData) {
  "use server";
  await moderateReviewAction(formData);
}

export default async function AdminReviewsPage() {
  await requireSuperAdmin();
  const { productReviews, storeReviews } = await getAllReviewsForModeration(30);

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Reviews</h1>
      <p className="mt-2 text-zinc-400">Moderate product and store reviews</p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-yellow-400">Product reviews</h2>
        <ul className="mt-4 space-y-3">
          {productReviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-white/10 bg-zinc-900 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-medium">{review.title ?? "Untitled"}</p>
                  <p className="mt-1 text-zinc-400">{review.body.slice(0, 200)}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {review.rating}★ · {review.status} · {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                {review.status === "flagged" && (
                  <div className="flex shrink-0 gap-2">
                    <form action={approveReview}>
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="reviewType" value="product" />
                      <input type="hidden" name="status" value="approved" />
                      <Button type="submit" size="sm">Approve</Button>
                    </form>
                    <form action={rejectReview}>
                      <input type="hidden" name="reviewId" value={review.id} />
                      <input type="hidden" name="reviewType" value="product" />
                      <input type="hidden" name="status" value="rejected" />
                      <Button type="submit" variant="ghost" size="sm">Reject</Button>
                    </form>
                  </div>
                )}
              </div>
            </li>
          ))}
          {productReviews.length === 0 && <li className="text-zinc-500">No product reviews.</li>}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-yellow-400">Store reviews</h2>
        <ul className="mt-4 space-y-3">
          {storeReviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-white/10 bg-zinc-900 p-4 text-sm">
              <p className="font-medium">{review.title ?? "Untitled"}</p>
              <p className="mt-1 text-zinc-400">{review.body.slice(0, 200)}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {review.rating}★ · {review.status}
              </p>
            </li>
          ))}
          {storeReviews.length === 0 && <li className="text-zinc-500">No store reviews.</li>}
        </ul>
      </section>

      <Link href="/admin/marketplace" className="mt-8 inline-block text-sm text-yellow-400 hover:underline">
        ← Marketplace overview
      </Link>
    </div>
  );
}
