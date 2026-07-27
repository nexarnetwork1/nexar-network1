import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";

/** Public entry to the customer marketplace — login required for checkout. */
export default async function MarketplacePage() {
  const profile = await getCurrentProfile();

  if (profile?.role === "customer") {
    redirect("/customer/browse");
  }

  if (profile?.role === "merchant") {
    redirect("/merchant");
  }

  redirect("/login?redirect=/customer/browse");
}
