import { redirect } from "next/navigation";

/** Public marketplace entry — browse stores without login. */
export default function MarketplacePage() {
  redirect("/marketplace/stores");
}
