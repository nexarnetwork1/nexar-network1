import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function MerchantLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  redirect(
    commerceAuthHref({
      auth: "signin",
      role: "merchant",
      redirect: sp.redirect ?? sp.next ?? "/merchant",
      message: sp.message,
    }),
  );
}
