import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { getPaymentMethods } from "@/modules/platform/repository";
import { PaymentMethodLogo } from "@/components/payments/PaymentMethodLogo";

export default async function CustomerPaymentMethodsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: "/customer/payment-methods" }));

  const methods = await getPaymentMethods();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">Payment methods</h1>
      <p className="mt-2 text-muted">
        Supported payment options on Nexar Network. Card payments require Stripe configuration.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {methods.map((method) => (
          <li
            key={method.id}
            className="rounded-2xl border border-border bg-card/40 p-5"
          >
            <PaymentMethodLogo method={method.code} size={18} />
            <p className="mt-1 text-xs uppercase text-muted">{method.kind}</p>
            <p className="mt-2 text-sm text-muted">
              {method.is_active ? "Available" : "Coming soon"}
            </p>
          </li>
        ))}
      </ul>
      {methods.length === 0 && (
        <p className="mt-8 text-muted">No payment methods configured.</p>
      )}
    </div>
  );
}
