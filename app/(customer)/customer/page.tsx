import { getCurrentProfile } from "@/modules/users/repository";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function CustomerDashboardPage() {
  const profile = await getCurrentProfile();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">
        Welcome, {profile?.full_name ?? "Customer"}
      </h1>
      <p className="mt-2 text-muted">
        Browse products, manage orders, and pay with crypto or card.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/customer/browse">
          <Button>Browse products</Button>
        </Link>
        <Link href="/customer/cart">
          <Button variant="secondary">View cart</Button>
        </Link>
      </div>
    </div>
  );
}
