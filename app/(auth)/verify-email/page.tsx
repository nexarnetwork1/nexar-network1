import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResendConfirmationForm } from "./ResendConfirmationForm";
import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/modules/auth/actions";

export default async function VerifyEmailPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { data: user } = await createAdminClient()
    .from("authjs_users")
    .select("email, emailVerified")
    .eq("id", session.user.id)
    .maybeSingle();

  if ((user as { emailVerified?: string | null } | null)?.emailVerified) {
    redirect("/dashboard");
  }

  return (
    <AuthCard
      title="Verify your email"
      subtitle="We sent a confirmation link to your inbox"
    >
      <p className="text-sm text-muted">
        Confirm{" "}
        <span className="text-white">
          {(user as { email?: string } | null)?.email ?? session.user.email}
        </span>{" "}
        to access your account. Check spam if you don&apos;t see the email within
        a few minutes.
      </p>

      <div className="mt-6">
        <ResendConfirmationForm
          email={
            (user as { email?: string } | null)?.email ??
            session.user.email ??
            ""
          }
        />
      </div>

      <form action={signOutAction} className="mt-8">
        <Button type="submit" variant="secondary" className="w-full">
          Sign out
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Wrong account?{" "}
        <Link href="/login" className="text-gold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
