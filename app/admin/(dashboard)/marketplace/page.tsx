import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/modules/users/repository";
import {
  DashboardCard,
  DashboardSection,
  DashboardStat,
  DashboardStats,
} from "@/components/dashboard";

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
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Marketplace operations"
        headingClassName="text-gold"
        description="Commerce catalog, orders, and trust & safety tools for the Nexar marketplace."
      />

      <DashboardStats columns={5}>
        <DashboardStat label="Products" value={products ?? 0} />
        <DashboardStat label="Active listings" value={activeProducts ?? 0} />
        <DashboardStat label="Marketplace stores" value={stores ?? 0} />
        <DashboardStat label="Orders" value={orders ?? 0} />
        <DashboardStat label="Reviews" value={productReviews ?? 0} />
      </DashboardStats>

      <DashboardSection level="h3" title="Jump to">
        <ul className="grid gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <DashboardCard as="li" key={link.href} flush interactive>
              <Link
                href={link.href}
                className="block rounded-2xl p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              >
                <p className="font-medium text-gold">{link.label}</p>
                <p className="mt-1 text-sm text-muted">{link.hint}</p>
              </Link>
            </DashboardCard>
          ))}
        </ul>
      </DashboardSection>
    </div>
  );
}
