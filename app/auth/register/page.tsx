import { redirect } from "next/navigation";
import { authModalHref } from "@/lib/auth/auth-modal-url";

type Props = {
  searchParams: Promise<{ role?: string }>;
};

export default async function AuthRegisterRedirectPage({ searchParams }: Props) {
  const sp = await searchParams;

  if (sp.role === "customer") {
    redirect(authModalHref({ auth: "register", role: "customer" }));
  }

  if (sp.role === "merchant") {
    redirect(authModalHref({ auth: "register", role: "merchant" }));
  }

  redirect(authModalHref({ auth: "register" }));
}
