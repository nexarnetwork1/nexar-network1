import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function CustomerRegisterPage({ searchParams }: Props) {
  const sp = await searchParams;
  redirect(
    commerceAuthHref({
      auth: "register",
      role: "customer",
      redirect: sp.redirect ?? sp.next,
      message: sp.message,
    }),
  );
}
