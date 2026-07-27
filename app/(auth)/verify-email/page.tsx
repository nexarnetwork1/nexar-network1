import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResendConfirmationForm } from "./ResendConfirmationForm";
import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/modules/auth/actions";

export default async function VerifyEmailPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.email_confirmed_at) {
    redirect("/dashboard");
  }

  return (
    <AuthCard
      title="Verify your email"
      subtitle="We sent a confirmation link to your inbox"
    >
      <p className="text-sm text-muted">
        Confirm <span className="text-white">{user.email}</span> to access your
        account. Check spam if you don&apos;t see the email within a few minutes.
      </p>

      <div className="mt-6">
        <ResendConfirmationForm email={user.email ?? ""} />
      </div>

      <form action={signOutAction} className="mt-8">
        <Button type="submit" variant="secondary" className="w-full">
          Sign out
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Wrong account?{" "}
        <Link href="/login" className="text-gold hover:text-gold-secondary">
          Use a different email
        </Link>
      </p>
    </AuthCard>
  );
}
