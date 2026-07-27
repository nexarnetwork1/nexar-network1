import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { getPaymentMethods } from "@/modules/platform/repository";

export default async function CustomerPaymentMethodsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

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
            <p className="font-medium">{method.name}</p>
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
