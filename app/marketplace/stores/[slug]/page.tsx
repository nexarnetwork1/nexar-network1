import { redirect } from "next/navigation";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ collection?: string }>;
};

/** Legacy storefront route — redirects to unified marketplace shop. */
export default async function LegacyStoreRedirectPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const url = new URL(MARKETPLACE_ROUTES.store(slug), "http://local");
  if (sp.collection) url.searchParams.set("collection", sp.collection);
  redirect(url.pathname + url.search);
}
