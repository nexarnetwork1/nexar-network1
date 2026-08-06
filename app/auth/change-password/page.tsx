import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AtlasLogo } from "@/components/ui/AtlasLogo";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata: Metadata = {
  title: "Change password | ATLAS",
};

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ hq?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?redirect=/auth/change-password");
  }
  const params = searchParams ? await searchParams : {};

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-6 flex justify-center">
        <AtlasLogo height={44} priority />
      </div>
      <h1 className="text-center font-heading text-2xl font-semibold text-white">
        Change password
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        {params.hq
          ? "Platform Owner must set a new password before using NEXAR HQ."
          : "Update your ATLAS account password."}
      </p>
      <div className="mt-6">
        <ChangePasswordForm hq={params.hq === "1"} userId={session.user.id} />
      </div>
    </main>
  );
}
