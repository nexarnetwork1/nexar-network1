import { redirect } from "next/navigation";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";

type Props = {
  params: Promise<{ slug: string; handle: string }>;
};

/** Legacy per-store product route — redirects to unified marketplace product page. */
export default async function LegacyStoreProductRedirectPage({ params }: Props) {
  const { handle } = await params;
  redirect(MARKETPLACE_ROUTES.product(handle));
}
