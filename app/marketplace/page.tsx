import { CommerceHome } from "@/components/commerce/home/CommerceHome";
import { loadCommerceHomeData } from "@/lib/commerce/home-loader";

export default async function MarketplacePage() {
  const data = await loadCommerceHomeData();

  return <CommerceHome data={data} />;
}
