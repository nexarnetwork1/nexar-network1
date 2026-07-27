import Link from "next/link";
import { requireSuperAdmin } from "@/modules/users/repository";
import { getAllDisputes } from "@/modules/disputes/repository";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function AdminDisputesPage() {
  await requireSuperAdmin();
  const disputes = await getAllDisputes();

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Disputes</h1>
      <p className="mt-2 text-muted">Review and resolve customer–merchant disputes.</p>
      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface/60 text-left text-muted">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {disputes.map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{d.order_id.slice(0, 8)}…</td>
                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-4 py-3 text-muted">{d.reason.slice(0, 80)}</td>
                <td className="px-4 py-3 text-muted">{new Date(d.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/disputes/${d.id}`} className="text-gold hover:underline">Review</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
