import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function CustomerLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const dest = new URLSearchParams();
  if (sp.redirect ?? sp.next) dest.set("redirect", (sp.redirect ?? sp.next)!);
  if (sp.message) dest.set("message", sp.message);
  const qs = dest.toString();
  redirect(`/login${qs ? `?${qs}` : ""}`);
}
