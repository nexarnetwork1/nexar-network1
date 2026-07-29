export default function AdminMarketplacePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Marketplace</h1>
      <p className="mt-2 max-w-2xl text-zinc-400">
        The legacy marketplace admin UI has been removed. A new domain architecture is in place
        under <code className="text-yellow-300">modules/marketplace</code>. Storefront and
        moderation UI will be rebuilt on this foundation.
      </p>
      <ul className="mt-8 list-inside list-disc space-y-2 text-sm text-zinc-300">
        <li>Catalog, cart, checkout, discovery, wishlist, reviews</li>
        <li>Versioned API at /api/marketplace/v1</li>
        <li>Realtime channel contracts defined</li>
      </ul>
    </div>
  );
}
