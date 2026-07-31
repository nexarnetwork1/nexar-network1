import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { authModalHref } from "@/lib/auth/auth-modal-url";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  redirect(
    authModalHref({
      auth: "signin",
      redirect: sp.redirect ?? sp.next,
      message: sp.message,
    }),
  );
}
