import { redirect } from "next/navigation";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";

type Props = {
  params: Promise<{ slug: string }>;
};

/** Legacy store shop route — redirects to unified marketplace shop. */
export default async function LegacyStoreShopRedirectPage({ params }: Props) {
  const { slug } = await params;
  redirect(MARKETPLACE_ROUTES.store(slug));
}
