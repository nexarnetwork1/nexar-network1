import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

// app/auth/register/page.tsx — legacy route, forward to ATLAS /login
export default async function AuthRegisterRedirectPage({ searchParams }: Props) {
  const sp = await searchParams;
  const dest = new URLSearchParams({ mode: "register" });
  if (sp.redirect ?? sp.next) dest.set("redirect", (sp.redirect ?? sp.next)!);
  if (sp.message) dest.set("message", sp.message);
  redirect(`/login?${dest.toString()}`);
}
