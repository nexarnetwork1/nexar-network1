import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { CreatePaymentRequestForm } from "@/components/merchant/CreatePaymentRequestForm";
import { DashboardSection } from "@/components/dashboard";

export default async function NewPaymentRequestPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: "/merchant/invoices/new" }));

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant");

  if (store.status !== "active") {
    return (
      <div className="space-y-6">
        <DashboardSection as="div" level="h1" title="New payment request" />
        <p className="text-amber-400">
          Your store must be active before creating payment requests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="New payment request"
        description="Create an invoice for a registered customer. They receive a notification and secure pay link."
      />
      <CreatePaymentRequestForm />
    </div>
  );
}
