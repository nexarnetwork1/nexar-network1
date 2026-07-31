import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AuthRegisterRedirectPage({ searchParams }: Props) {
  const sp = await searchParams;
  const redirectPath = sp.redirect ?? sp.next;
  const message = sp.message;

  if (sp.role === "customer") {
    redirect(
      commerceAuthHref({
        auth: "register",
        role: "customer",
        redirect: redirectPath,
        message,
      }),
    );
  }

  if (sp.role === "merchant") {
    redirect(
      commerceAuthHref({
        auth: "register",
        role: "merchant",
        redirect: redirectPath,
        message,
      }),
    );
  }

  redirect(
    commerceAuthHref({
      auth: "register",
      redirect: redirectPath,
      message,
    }),
  );
}
