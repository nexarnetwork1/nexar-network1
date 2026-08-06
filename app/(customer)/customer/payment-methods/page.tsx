import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getPaymentMethods } from "@/modules/platform/repository";
import { PaymentMethodLogo } from "@/components/payments/PaymentMethodLogo";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
} from "@/components/dashboard";

export default async function CustomerPaymentMethodsPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
  redirect("/login?redirect=/customer/payment-methods");
}

  const methods = await getPaymentMethods();

  return (
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="Payment methods"
        description="Supported payment options on Nexar Network. Card payments require Stripe configuration."
      />

      {methods.length === 0 ? (
        <DashboardEmptyState
          icon={<CreditCard className="h-6 w-6" aria-hidden />}
          title="No payment methods configured"
          description="Once the platform enables a payment option it will be listed here."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {methods.map((method) => (
            <DashboardCard as="li" key={method.id} className="min-w-0">
              <PaymentMethodLogo method={method.code} size={18} />
              <p className="mt-1 truncate text-xs uppercase text-muted">{method.kind}</p>
              <p className="mt-2 text-sm text-muted">
                {method.is_active ? "Available" : "Coming soon"}
              </p>
            </DashboardCard>
          ))}
        </ul>
      )}
    </div>
  );
}
