import Link from "next/link";
import { requireSuperAdmin } from "@/modules/users/repository";
import { getAllReports } from "@/modules/reports/repository";
import { resolveReportAction } from "@/modules/reports/actions";
import { Button } from "@/components/ui/Button";

async function actionReport(formData: FormData) {
  "use server";
  await resolveReportAction(formData);
}

async function dismissReport(formData: FormData) {
  "use server";
  await resolveReportAction(formData);
}

export default async function AdminReportsPage() {
  await requireSuperAdmin();
  const reports = await getAllReports(50);
  const pending = reports.filter((r) => r.status === "pending");

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Reports</h1>
      <p className="mt-2 text-zinc-400">
        Product, store, and review reports · {pending.length} pending
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-3" scope="col">Type</th>
              <th className="px-4 py-3" scope="col">Reason</th>
              <th className="px-4 py-3" scope="col">Status</th>
              <th className="px-4 py-3" scope="col">Date</th>
              <th className="px-4 py-3" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-white/5">
                <td className="px-4 py-3 capitalize">{report.target_type.replace("_", " ")}</td>
                <td className="px-4 py-3">{report.reason}</td>
                <td className="px-4 py-3 capitalize">{report.status}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(report.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {report.status === "pending" && (
                    <div className="flex gap-2">
                      <form action={actionReport}>
                        <input type="hidden" name="reportId" value={report.id} />
                        <input type="hidden" name="status" value="actioned" />
                        <Button type="submit" size="sm">Action</Button>
                      </form>
                      <form action={dismissReport}>
                        <input type="hidden" name="reportId" value={report.id} />
                        <input type="hidden" name="status" value="dismissed" />
                        <Button type="submit" variant="ghost" size="sm">Dismiss</Button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No reports yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Link href="/admin/security" className="mt-8 inline-block text-sm text-yellow-400 hover:underline">
        Security settings →
      </Link>
    </div>
  );
}
