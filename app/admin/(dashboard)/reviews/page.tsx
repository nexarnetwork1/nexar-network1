import Link from "next/link";
import { Star, Store } from "lucide-react";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import {
  listRecentProductReviews,
  listRecentStoreReviews,
  moderateReviewAction,
} from "@/modules/marketplace/reviews/actions";
import { requireSuperAdmin } from "@/modules/users/repository";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardTable,
  DashboardTableBody,
  DashboardTableCell,
  DashboardTableEmpty,
  DashboardTableHead,
  DashboardTableHeader,
  DashboardTableRow,
} from "@/components/dashboard";

const moderationButtonClass =
  "inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50";

const MODERATION_ACTIONS = [
  { value: "approved", label: "Approve", tone: "bg-success/10 text-success hover:bg-success/20" },
  { value: "hidden", label: "Hide", tone: "bg-surface text-white/80 hover:bg-white/10" },
  { value: "rejected", label: "Reject", tone: "bg-red-500/10 text-red-400 hover:bg-red-500/20" },
] as const;

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
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Review moderation"
        description="Approve, hide, or reject marketplace product and store reviews."
      />

      <DashboardSection title="Product reviews">
        <DashboardCard flush className="overflow-hidden">
          <DashboardTable caption="Recent product reviews" minWidth="52rem">
            <DashboardTableHead>
              <DashboardTableRow>
                <DashboardTableHeader>Product</DashboardTableHeader>
                <DashboardTableHeader hideBelow="md">Customer</DashboardTableHeader>
                <DashboardTableHeader hideBelow="sm">Rating</DashboardTableHeader>
                <DashboardTableHeader>Status</DashboardTableHeader>
                <DashboardTableHeader align="right">Actions</DashboardTableHeader>
              </DashboardTableRow>
            </DashboardTableHead>
            <DashboardTableBody>
              {productReviews.length === 0 ? (
                <DashboardTableEmpty colSpan={5}>
                  <DashboardEmptyState
                    inset
                    icon={<Star className="h-5 w-5" aria-hidden />}
                    title="No product reviews yet"
                    description="Product reviews awaiting moderation will appear here."
                  />
                </DashboardTableEmpty>
              ) : (
                productReviews.map((review) => {
                  const product = review.product as { name?: string; slug?: string } | null;
                  const customer = review.customer as { full_name?: string } | null;
                  return (
                    <DashboardTableRow key={review.id as string} interactive>
                      <DashboardTableCell wrap className="max-w-[22rem]">
                        {product?.slug ? (
                          <Link
                            href={`/marketplace/products/${product.slug}`}
                            className="font-medium hover:text-gold"
                          >
                            {product.name}
                          </Link>
                        ) : (
                          product?.name ?? "—"
                        )}
                        <p className="mt-1 line-clamp-2 text-xs text-muted">
                          {review.body as string}
                        </p>
                      </DashboardTableCell>
                      <DashboardTableCell wrap hideBelow="md">
                        {customer?.full_name ?? "Customer"}
                      </DashboardTableCell>
                      <DashboardTableCell hideBelow="sm">
                        {review.rating as number}
                      </DashboardTableCell>
                      <DashboardTableCell className="capitalize">
                        {review.status as string}
                      </DashboardTableCell>
                      <DashboardTableCell align="right">
                        <form
                          action={moderateFormAction}
                          className="flex flex-wrap items-center justify-end gap-2"
                        >
                          <input type="hidden" name="reviewId" value={review.id as string} />
                          <input type="hidden" name="type" value="product" />
                          {MODERATION_ACTIONS.map((action) => (
                            <button
                              key={action.value}
                              type="submit"
                              name="status"
                              value={action.value}
                              className={`${moderationButtonClass} ${action.tone}`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </form>
                      </DashboardTableCell>
                    </DashboardTableRow>
                  );
                })
              )}
            </DashboardTableBody>
          </DashboardTable>
        </DashboardCard>
      </DashboardSection>

      <DashboardSection title="Store reviews">
        <DashboardCard flush className="overflow-hidden">
          <DashboardTable caption="Recent store reviews" minWidth="52rem">
            <DashboardTableHead>
              <DashboardTableRow>
                <DashboardTableHeader>Store</DashboardTableHeader>
                <DashboardTableHeader hideBelow="md">Customer</DashboardTableHeader>
                <DashboardTableHeader hideBelow="sm">Rating</DashboardTableHeader>
                <DashboardTableHeader>Status</DashboardTableHeader>
                <DashboardTableHeader align="right">Actions</DashboardTableHeader>
              </DashboardTableRow>
            </DashboardTableHead>
            <DashboardTableBody>
              {storeReviews.length === 0 ? (
                <DashboardTableEmpty colSpan={5}>
                  <DashboardEmptyState
                    inset
                    icon={<Store className="h-5 w-5" aria-hidden />}
                    title="No store reviews yet"
                    description="Store reviews awaiting moderation will appear here."
                  />
                </DashboardTableEmpty>
              ) : (
                storeReviews.map((review) => {
                  const store = review.store as { name?: string; slug?: string } | null;
                  const customer = review.customer as { full_name?: string } | null;
                  return (
                    <DashboardTableRow key={review.id as string} interactive>
                      <DashboardTableCell wrap className="max-w-[22rem]">
                        {store?.slug ? (
                          <Link
                            href={MARKETPLACE_ROUTES.store(store.slug)}
                            className="font-medium hover:text-gold"
                          >
                            {store.name}
                          </Link>
                        ) : (
                          store?.name ?? "—"
                        )}
                        <p className="mt-1 line-clamp-2 text-xs text-muted">
                          {review.body as string}
                        </p>
                      </DashboardTableCell>
                      <DashboardTableCell wrap hideBelow="md">
                        {customer?.full_name ?? "Customer"}
                      </DashboardTableCell>
                      <DashboardTableCell hideBelow="sm">
                        {review.rating as number}
                      </DashboardTableCell>
                      <DashboardTableCell className="capitalize">
                        {review.status as string}
                      </DashboardTableCell>
                      <DashboardTableCell align="right">
                        <form
                          action={moderateFormAction}
                          className="flex flex-wrap items-center justify-end gap-2"
                        >
                          <input type="hidden" name="reviewId" value={review.id as string} />
                          <input type="hidden" name="type" value="store" />
                          {MODERATION_ACTIONS.map((action) => (
                            <button
                              key={action.value}
                              type="submit"
                              name="status"
                              value={action.value}
                              className={`${moderationButtonClass} ${action.tone}`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </form>
                      </DashboardTableCell>
                    </DashboardTableRow>
                  );
                })
              )}
            </DashboardTableBody>
          </DashboardTable>
        </DashboardCard>
      </DashboardSection>
    </div>
  );
}
