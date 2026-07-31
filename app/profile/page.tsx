import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Profile | Nexar Network",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(commerceAuthHref({ auth: "signin", redirect: "/profile" }));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, wallet_address, created_at")
    .eq("id", user.id)
    .single();

  return (
    <main className="py-24">
      <Container>
        <SectionHeading
          eyebrow="Account"
          title="Profile"
          description="Manage your account details."
        />
        <dl className="mt-12 grid gap-6 rounded-2xl border border-border bg-card p-8 md:grid-cols-2">
          <div>
            <dt className="text-sm text-muted">Full Name</dt>
            <dd className="mt-1 font-medium">{profile?.full_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Email</dt>
            <dd className="mt-1 font-medium">{profile?.email ?? user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Role</dt>
            <dd className="mt-1 font-medium capitalize">{profile?.role ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Wallet</dt>
            <dd className="mt-1 font-mono text-sm">{profile?.wallet_address ?? "—"}</dd>
          </div>
        </dl>
      </Container>
    </main>
  );
}
