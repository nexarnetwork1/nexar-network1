import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";

export default function MarketplaceFoundationPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-gold/80">Marketplace v2</p>
      <h1 className="mt-4 font-heading text-3xl font-semibold text-white sm:text-4xl">
        Storefront foundation ready
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
        The legacy marketplace UI has been removed. A scalable domain architecture is in place
        for catalog, cart, checkout, discovery, wishlist, reviews, and realtime — ready for
        Shopify-level implementation.
      </p>
      <dl className="mt-10 grid w-full gap-3 text-left text-sm sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-surface/40 p-4">
          <dt className="text-xs uppercase tracking-wider text-muted">Storefront root</dt>
          <dd className="mt-1 font-mono text-gold">{MARKETPLACE_ROUTES.root}</dd>
        </div>
        <div className="rounded-xl border border-border/60 bg-surface/40 p-4">
          <dt className="text-xs uppercase tracking-wider text-muted">API</dt>
          <dd className="mt-1 font-mono text-gold">/api/marketplace/v1</dd>
        </div>
      </dl>
    </main>
  );
}
