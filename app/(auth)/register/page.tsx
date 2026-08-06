import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const sp = await searchParams;
  const dest = new URLSearchParams({ mode: "register" });
  if (sp.redirect) dest.set("redirect", sp.redirect);
  if (sp.next) dest.set("redirect", sp.next);
  if (sp.message) dest.set("message", sp.message);
  redirect(`/login?${dest.toString()}`);
}
