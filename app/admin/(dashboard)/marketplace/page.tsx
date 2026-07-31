import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/modules/users/repository";

export default async function AdminMarketplacePage() {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const [
    { count: products },
    { count: activeProducts },
    { count: stores },
    { count: orders },
    { count: productReviews },
  ] = await Promise.all([
    admin.from("products").select("*", { count: "exact", head: true }),
    admin.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
    admin.from("stores").select("*", { count: "exact", head: true }).eq("mode", "marketplace"),
    admin.from("orders").select("*", { count: "exact", head: true }),
    admin.from("product_reviews").select("*", { count: "exact", head: true }),
  ]);

  const links = [
    { href: "/admin/products", label: "Product moderation", hint: "Activate or hide catalog items" },
    { href: "/admin/orders", label: "Orders", hint: "Platform-wide order management" },
    { href: "/admin/reviews", label: "Reviews", hint: "Moderate product and store reviews" },
    { href: "/admin/merchants", label: "Merchants", hint: "Merchant approvals and stores" },
    { href: "/admin/customers", label: "Customers", hint: "Customer accounts" },
    { href: "/admin/verification", label: "Verification", hint: "KYC and store verification" },
    { href: "/marketplace", label: "View storefront", hint: "Public marketplace homepage" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Marketplace operations</h1>
      <p className="mt-2 max-w-2xl text-zinc-400">
        Commerce catalog, orders, and trust &amp; safety tools for the Nexar marketplace.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Products", value: products ?? 0 },
          { label: "Active listings", value: activeProducts ?? 0 },
          { label: "Marketplace stores", value: stores ?? 0 },
          { label: "Orders", value: orders ?? 0 },
          { label: "Reviews", value: productReviews ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-2xl border border-white/10 bg-zinc-900/40 p-5 transition-colors hover:border-yellow-500/30"
            >
              <p className="font-medium text-yellow-300">{link.label}</p>
              <p className="mt-1 text-sm text-zinc-500">{link.hint}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
