import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { CreatePaymentRequestForm } from "@/components/merchant/CreatePaymentRequestForm";

export default async function NewPaymentRequestPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: "/merchant/invoices/new" }));

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant");

  if (store.status !== "active") {
    return (
      <div>
        <h1 className="font-heading text-3xl font-semibold">New payment request</h1>
        <p className="mt-4 text-amber-400">Your store must be active before creating payment requests.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">New payment request</h1>
      <p className="mt-2 text-muted">
        Create an invoice for a registered customer. They receive a notification and secure pay link.
      </p>
      <div className="mt-8">
        <CreatePaymentRequestForm />
      </div>
    </div>
  );
}
