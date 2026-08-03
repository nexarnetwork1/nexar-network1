import Link from "next/link";
import { Clock, ShieldCheck, Store } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StoreSetupProgress } from "@/components/merchant/StoreSetupProgress";
import { createClient } from "@/lib/supabase/server";
import { merchantCommerceConfig } from "@/config/merchant-commerce";
import { DashboardActions, DashboardCard } from "@/components/dashboard";

export default async function MerchantOnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "merchant") {
    redirect("/marketplace?auth=signin&redirect=/merchant/onboarding");
  }

  const store = await getMerchantStore(profile.id);
  if (!store) {
    redirect("/marketplace?auth=register&role=merchant");
  }

  if (store.status === "active") {
    redirect("/merchant");
  }

  const supabase = await createClient();
  const { count: productCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("store_id", store.id);

  const completedStepIds = ["store"];
  if (store.logo_url) completedStepIds.push("logo");
  if ((productCount ?? 0) > 0) completedStepIds.push("products");
  if (store.wallet_address) completedStepIds.push("payments");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <DashboardCard className="border-amber-500/30 bg-amber-500/5 p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
          <Clock className="h-7 w-7 text-amber-400" aria-hidden />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-white">
          Your store is awaiting approval
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Thanks for joining Nexar Commerce, <strong className="text-white">{profile.full_name}</strong>.
          Our team is reviewing <strong className="text-gold">{store.name}</strong> before it goes live on
          the marketplace.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-background/40 px-4 py-2 text-xs capitalize text-amber-300">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Status: {store.status.replace("_", " ")}
        </div>
      </DashboardCard>

      <DashboardCard>
        <h2 className="font-heading text-sm font-medium text-white">Store setup checklist</h2>
        <p className="mt-1 text-xs text-muted">
          Complete these steps while your store is under review — ${merchantCommerceConfig.storeCreation.amountUsd}{" "}
          activation + subscription billing applies at launch.
        </p>
        <StoreSetupProgress completedStepIds={completedStepIds} className="mt-5" />
      </DashboardCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <DashboardCard>
          <Store className="h-5 w-5 text-gold" aria-hidden />
          <h2 className="mt-3 font-heading text-sm font-medium text-white">While you wait</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Set up products, configure your store profile, and connect your wallet so you are ready
            when approval completes.
          </p>
        </DashboardCard>
        <DashboardCard>
          <ShieldCheck className="h-5 w-5 text-gold" aria-hidden />
          <h2 className="mt-3 font-heading text-sm font-medium text-white">What happens next</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Once approved, your store appears in the unified Nexar Commerce marketplace and you can
            start accepting orders.
          </p>
        </DashboardCard>
      </div>

      <DashboardActions stackOnMobile>
        <Link href="/merchant">
          <Button className="w-full sm:w-auto">Go to merchant dashboard</Button>
        </Link>
        <Link href="/merchant/store">
          <Button variant="secondary" className="w-full sm:w-auto">
            Configure store
          </Button>
        </Link>
        <Link href="/marketplace">
          <Button variant="outline" className="w-full sm:w-auto">
            Browse marketplace
          </Button>
        </Link>
      </DashboardActions>
    </div>
  );
}
