import { redirect } from "next/navigation";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { destroyDatabaseSession } from "@/lib/auth/database-session";

async function logoutHqAction() {
  "use server";
  await destroyDatabaseSession().catch(() => undefined);
  redirect("/admin/login");
}

/**
 * NEXAR HQ header controls — Auth.js session (Platform Owner / HQ RBAC).
 */
export function AdminHeaderActions({
  label,
}: {
  label: string;
  email?: string;
}) {
  return (
    <>
      <div className="hidden w-56 lg:block xl:w-72">
        <GlobalSearch apiPath="/api/search" />
      </div>

      <span className="hidden text-xs text-muted xl:inline">{label}</span>

      <form action={logoutHqAction}>
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-xl border border-red-500/40 bg-red-500/10 px-3 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 sm:px-4 sm:text-sm"
        >
          <span className="hidden sm:inline">Sign out</span>
          <span className="sm:hidden">Out</span>
        </button>
      </form>
    </>
  );
}
