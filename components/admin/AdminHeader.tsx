import { redirect } from "next/navigation";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { clearSuperAdminSessionCookie } from "@/lib/admin/super-admin";

async function logoutAdminAction() {
  "use server";
  await clearSuperAdminSessionCookie();
  redirect("/");
}

export function AdminHeader({ walletAddress }: { walletAddress: string }) {
  const short =
    walletAddress.length > 10
      ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
      : walletAddress;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-yellow-500/20 px-8 py-4">
      <GlobalSearch apiPath="/api/search" />
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-400">Super Admin · {short}</span>
        <form action={logoutAdminAction}>
          <button
            type="submit"
            className="rounded-lg bg-red-600/90 px-4 py-2 text-sm font-semibold transition hover:bg-red-500"
          >
            End admin session
          </button>
        </form>
      </div>
    </div>
  );
}
