import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/modules/users/repository";
import { signOutAction } from "@/modules/auth/actions";
import { CartBadge } from "@/components/cart/CartBadge";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "customer") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/customer" className="font-heading text-gold">
              Nexar
            </Link>
            <Link href="/customer/browse" className="text-muted hover:text-white">
              Browse
            </Link>
            <CartBadge />
            <Link href="/customer/orders" className="text-muted hover:text-white">
              Orders
            </Link>
            <Link href="/customer/invoices" className="text-muted hover:text-white">
              Invoices
            </Link>
            <Link href="/customer/wallet" className="text-muted hover:text-white">
              Wallet
            </Link>
          </nav>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
