import { requireRole } from "@/modules/users/repository";
import { getPendingVerifications } from "@/modules/verification/repository";
import { adminUpdateVerificationAction } from "@/modules/verification/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function AdminVerificationPage() {
  await requireRole(["admin"]);
  const pending = await getPendingVerifications();
  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", pending.map((p) => p.profile_id));

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Merchant Verification</h1>
      <p className="mt-2 text-muted">Review merchant KYC status and verification levels.</p>
      <div className="mt-8 space-y-4">
        {pending.map((m) => {
          const profile = profileMap.get(m.profile_id);
          return (
            <div key={m.id} className="rounded-xl border border-border p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">{m.business_name ?? profile?.full_name}</p>
                  <p className="text-sm text-muted">{profile?.email}</p>
                  <div className="mt-2 flex gap-2">
                    <StatusBadge status={m.verification_status} />
                    <span className="text-xs uppercase text-muted">{m.verification_level}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={async () => {
                    "use server";
                    await adminUpdateVerificationAction({ profileId: m.profile_id, status: "verified", level: "business" });
                  }}>
                    <Button type="submit" size="sm">Verify</Button>
                  </form>
                  <form action={async () => {
                    "use server";
                    await adminUpdateVerificationAction({ profileId: m.profile_id, status: "rejected", reason: "Does not meet requirements" });
                  }}>
                    <Button type="submit" size="sm" variant="ghost">Reject</Button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
        {pending.length === 0 && <p className="text-muted">No pending verifications.</p>}
      </div>
    </div>
  );
}
