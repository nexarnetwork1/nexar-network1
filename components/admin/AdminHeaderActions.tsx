import { redirect } from "next/navigation";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { clearSuperAdminSessionCookie } from "@/lib/admin/super-admin";

async function logoutAdminAction() {
  "use server";
  await clearSuperAdminSessionCookie();
  redirect("/");
}

/**
 * Right-hand controls for the admin dashboard header: global search, the
 * signed-in treasury wallet and the session kill switch. Same behaviour as the
 * previous `AdminHeader` bar, now slotted into the shared dashboard header.
 */
export function AdminHeaderActions({ walletAddress }: { walletAddress: string }) {
  const short =
    walletAddress.length > 10
      ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
      : walletAddress;

  return (
    <>
      <div className="hidden w-56 lg:block xl:w-72">
        <GlobalSearch apiPath="/api/search" />
      </div>

      <span className="hidden text-xs text-muted xl:inline" title={walletAddress}>
        Super Admin · {short}
      </span>

      <form action={logoutAdminAction}>
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-xl border border-red-500/40 bg-red-500/10 px-3 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 sm:px-4 sm:text-sm"
        >
          <span className="hidden sm:inline">End admin session</span>
          <span className="sm:hidden">Sign out</span>
        </button>
      </form>
    </>
  );
}
