import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  redirect(
    commerceAuthHref({
      auth: "signin",
      redirect: sp.redirect ?? sp.next,
      message: sp.message,
    }),
  );
}
