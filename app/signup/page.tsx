import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function SignupPage({ searchParams }: Props) {
  const sp = await searchParams;
  redirect(
    commerceAuthHref({
      auth: "register",
      redirect: sp.redirect ?? sp.next,
      message: sp.message,
    }),
  );
}
