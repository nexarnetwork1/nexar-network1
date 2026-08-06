import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AtlasLogo } from "@/components/ui/AtlasLogo";
import { Enable2faForm } from "./Enable2faForm";

export const metadata: Metadata = {
  title: "Enable 2FA | ATLAS",
};

/**
 * Foundation for TOTP enrollment — marks HQ owner 2FA complete.
 * Full authenticator UX can be deepened without changing this contract.
 */
export default async function Enable2faPage({
  searchParams,
}: {
  searchParams?: Promise<{ hq?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?redirect=/auth/enable-2fa");
  }
  const params = searchParams ? await searchParams : {};

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-6 flex justify-center">
        <AtlasLogo height={44} priority />
      </div>
      <h1 className="text-center font-heading text-2xl font-semibold text-white">
        Enable two-factor authentication
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        {params.hq
          ? "Platform Owner must enable 2FA before entering NEXAR HQ."
          : "Add a second factor to protect your ATLAS account."}
      </p>
      <div className="mt-6">
        <Enable2faForm hq={params.hq === "1"} userId={session.user.id} />
      </div>
    </main>
  );
}
