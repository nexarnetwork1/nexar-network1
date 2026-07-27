import { requireSuperAdmin } from "@/modules/users/repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { releaseEscrowAction } from "@/modules/escrow/actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import type { Escrow } from "@/types";

export default async function AdminEscrowPage() {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { data } = await admin.from("escrows").select("*").order("created_at", { ascending: false }).limit(100);
  const escrows = (data ?? []) as Escrow[];

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Escrow</h1>
      <p className="mt-2 text-muted">Funds held until release conditions are met.</p>
      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface/60 text-left text-muted">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Held</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {escrows.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{e.order_id.slice(0, 8)}…</td>
                <td className="px-4 py-3">${Number(e.amount).toFixed(2)} {e.currency}</td>
                <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                <td className="px-4 py-3 text-muted">{e.held_at ? new Date(e.held_at).toLocaleString() : "—"}</td>
                <td className="px-4 py-3">
                  {e.status === "held" && (
                    <form action={async () => {
                      "use server";
                      await releaseEscrowAction(e.id, "admin_release");
                    }}>
                      <Button type="submit" size="sm">Release</Button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
