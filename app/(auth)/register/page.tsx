import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create account"
      subtitle="Choose how you want to use Nexar Network"
    >
      <div className="space-y-4">
        <Link href="/register/customer" className="block">
          <Button variant="primary" className="w-full">
            Register as Customer
          </Button>
        </Link>
        <Link href="/register/merchant" className="block">
          <Button variant="secondary" className="w-full">
            Register as Merchant
          </Button>
        </Link>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-gold hover:text-gold-secondary">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
