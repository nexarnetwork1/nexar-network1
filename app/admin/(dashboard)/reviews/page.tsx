import Link from "next/link";

export default function AdminReviewsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Reviews</h1>
      <p className="mt-2 max-w-2xl text-zinc-400">
        Review moderation UI will be rebuilt on the new marketplace reviews module.
      </p>
      <Link href="/admin/marketplace" className="mt-8 inline-block text-sm text-yellow-400 hover:underline">
        ← Marketplace overview
      </Link>
    </div>
  );
}
