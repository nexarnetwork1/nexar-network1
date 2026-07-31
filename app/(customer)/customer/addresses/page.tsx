import Link from "next/link";
import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { MapPin } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { Button } from "@/components/ui/Button";

export default async function CustomerAddressesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: "/customer/addresses" }));

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Saved addresses</h1>
      <p className="mt-2 text-muted">Manage shipping and billing addresses for faster checkout.</p>

      <div className="relative mt-12 overflow-hidden rounded-3xl border border-border bg-card/40 p-10 text-center sm:p-14">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/20 bg-gold/5">
          <MapPin className="h-8 w-8 text-gold/70" aria-hidden />
        </div>
        <h2 className="font-heading text-2xl font-semibold text-white">Address book coming soon</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
          Saved addresses are not available yet. During checkout, shipping details are collected per
          order. We will add address management here in a future update.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/customer/orders">
            <Button variant="secondary">View orders</Button>
          </Link>
          <Link href="/customer/profile">
            <Button variant="ghost">Account settings</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
