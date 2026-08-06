import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { Button } from "@/components/ui/Button";
import {
  DashboardActions,
  DashboardEmptyState,
  DashboardSection,
} from "@/components/dashboard";

export default async function CustomerAddressesPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
  redirect("/login?redirect=/customer/addresses");
}

  return (
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="Saved addresses"
        description="Manage shipping and billing addresses for faster checkout."
      />

      <DashboardEmptyState
        icon={<MapPin className="h-6 w-6" aria-hidden />}
        title="Address book coming soon"
        description="Saved addresses are not available yet. During checkout, shipping details are collected per order. We will add address management here in a future update."
        action={
          <DashboardActions className="justify-center">
            <Link
              href="/customer/orders"
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            >
              <Button variant="secondary">View orders</Button>
            </Link>
            <Link
              href="/customer/profile"
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            >
              <Button variant="ghost">Account settings</Button>
            </Link>
          </DashboardActions>
        }
      />
    </div>
  );
}
