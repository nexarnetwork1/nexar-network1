import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function CustomerLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  redirect(
    commerceAuthHref({
      auth: "signin",
      role: "customer",
      redirect: sp.redirect ?? sp.next ?? "/marketplace",
      message: sp.message,
    }),
  );
}
