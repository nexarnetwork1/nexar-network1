import Link from "next/link";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import {
  listRecentProductReviews,
  listRecentStoreReviews,
  moderateReviewAction,
} from "@/modules/marketplace/reviews/actions";
import { requireSuperAdmin } from "@/modules/users/repository";

async function moderateFormAction(formData: FormData) {
  "use server";
  await moderateReviewAction(formData);
}

export default async function AdminReviewsPage() {
  await requireSuperAdmin();
  const [productReviews, storeReviews] = await Promise.all([
    listRecentProductReviews(40),
    listRecentStoreReviews(40),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Review moderation</h1>
      <p className="mt-2 text-zinc-400">Approve, hide, or reject marketplace product and store reviews.</p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Product reviews</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {productReviews.map((review) => {
                const product = review.product as { name?: string; slug?: string } | null;
                const customer = review.customer as { full_name?: string } | null;
                return (
                  <tr key={review.id as string} className="border-b border-white/5">
                    <td className="px-4 py-3">
                      {product?.slug ? (
                        <Link href={`/marketplace/products/${product.slug}`} className="hover:text-yellow-400">
                          {product.name}
                        </Link>
                      ) : (
                        product?.name ?? "—"
                      )}
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{review.body as string}</p>
                    </td>
                    <td className="px-4 py-3">{customer?.full_name ?? "Customer"}</td>
                    <td className="px-4 py-3">{review.rating as number}</td>
                    <td className="px-4 py-3 capitalize">{review.status as string}</td>
                    <td className="px-4 py-3">
                      <form action={moderateFormAction} className="flex flex-wrap gap-2">
                        <input type="hidden" name="reviewId" value={review.id as string} />
                        <input type="hidden" name="type" value="product" />
                        <button
                          type="submit"
                          name="status"
                          value="approved"
                          className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400"
                        >
                          Approve
                        </button>
                        <button
                          type="submit"
                          name="status"
                          value="hidden"
                          className="rounded-lg bg-zinc-500/10 px-2 py-1 text-xs text-zinc-300"
                        >
                          Hide
                        </button>
                        <button
                          type="submit"
                          name="status"
                          value="rejected"
                          className="rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-400"
                        >
                          Reject
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {productReviews.length === 0 && (
            <p className="p-8 text-center text-zinc-500">No product reviews yet.</p>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-white">Store reviews</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {storeReviews.map((review) => {
                const store = review.store as { name?: string; slug?: string } | null;
                const customer = review.customer as { full_name?: string } | null;
                return (
                  <tr key={review.id as string} className="border-b border-white/5">
                    <td className="px-4 py-3">
                      {store?.slug ? (
                        <Link href={MARKETPLACE_ROUTES.store(store.slug)} className="hover:text-yellow-400">
                          {store.name}
                        </Link>
                      ) : (
                        store?.name ?? "—"
                      )}
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{review.body as string}</p>
                    </td>
                    <td className="px-4 py-3">{customer?.full_name ?? "Customer"}</td>
                    <td className="px-4 py-3">{review.rating as number}</td>
                    <td className="px-4 py-3 capitalize">{review.status as string}</td>
                    <td className="px-4 py-3">
                      <form action={moderateFormAction} className="flex flex-wrap gap-2">
                        <input type="hidden" name="reviewId" value={review.id as string} />
                        <input type="hidden" name="type" value="store" />
                        <button
                          type="submit"
                          name="status"
                          value="approved"
                          className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400"
                        >
                          Approve
                        </button>
                        <button
                          type="submit"
                          name="status"
                          value="hidden"
                          className="rounded-lg bg-zinc-500/10 px-2 py-1 text-xs text-zinc-300"
                        >
                          Hide
                        </button>
                        <button
                          type="submit"
                          name="status"
                          value="rejected"
                          className="rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-400"
                        >
                          Reject
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {storeReviews.length === 0 && (
            <p className="p-8 text-center text-zinc-500">No store reviews yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
