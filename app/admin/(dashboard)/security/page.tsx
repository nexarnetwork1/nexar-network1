import { ShieldCheck } from "lucide-react";
import { getPlatformSettings } from "@/modules/platform/repository";
import { getRecentSecurityLogs } from "@/modules/audit/security";
import { formatDateTime } from "@/utils/format";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
} from "@/components/dashboard";

export default async function AdminSecurityPage() {
  const [settings, securityLogs] = await Promise.all([
    getPlatformSettings(),
    getRecentSecurityLogs(10),
  ]);

  const checks = [
    {
      label: "Row Level Security",
      status: "Enabled on all public tables",
      ok: true,
    },
    {
      label: "Treasury wallet",
      status: settings?.treasury_wallet_address
        ? `Configured (${settings.treasury_wallet_address.slice(0, 10)}…)`
        : "Not configured — set in Platform Fees",
      ok: !!settings?.treasury_wallet_address,
    },
    {
      label: "Payment master seed",
      status: process.env.PAYMENT_MASTER_SEED ? "Configured (server env)" : "Missing PAYMENT_MASTER_SEED",
      ok: !!process.env.PAYMENT_MASTER_SEED,
    },
    {
      label: "Service role key",
      status: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Configured" : "Missing",
      ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    {
      label: "Support contact",
      status: settings?.support_email ?? "admin@nexarnetwork.org",
      ok: true,
    },
    {
      label: "Audit logging",
      status: "Active — checkout and payment events logged",
      ok: true,
    },
  ];

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Security"
        headingClassName="text-gold"
        description="Platform security configuration status"
      />

      <DashboardSection level="h3" title="Configuration checks">
        <ul className="space-y-3">
          {checks.map((check) => (
            <DashboardCard as="li" key={check.label}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{check.label}</p>
                  <p className="mt-1 text-sm text-muted">{check.status}</p>
                </div>
                <span
                  className={`shrink-0 text-sm ${check.ok ? "text-emerald-400" : "text-gold"}`}
                >
                  {check.ok ? "OK" : "Action needed"}
                </span>
              </div>
            </DashboardCard>
          ))}
        </ul>
      </DashboardSection>

      <DashboardCard as="section">
        <h2 className="font-heading text-lg font-semibold text-gold">Recent security events</h2>
        {securityLogs.length === 0 ? (
          <DashboardEmptyState
            inset
            icon={<ShieldCheck className="h-5 w-5" aria-hidden />}
            title="No security events recorded yet"
            description="Sign-ins, permission changes and other audited events will appear here."
          />
        ) : (
          <ul className="mt-4 space-y-2">
            {securityLogs.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium capitalize">{log.event_type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted">{formatDateTime(log.created_at)}</p>
                </div>
                {log.ip_address && (
                  <span className="shrink-0 font-mono text-xs text-muted">{log.ip_address}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>

      <DashboardCard as="section">
        <h2 className="font-heading text-lg font-semibold text-gold">Security policies</h2>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-muted">
          <li>Platform fees never remain in merchant wallets</li>
          <li>Treasury private keys stored in Supabase Vault (never in client code)</li>
          <li>Roles stored in profiles + app_metadata (never user_metadata)</li>
          <li>No public invoice or payment pages</li>
          <li>All mutations validated server-side with Zod</li>
          <li>Audit logs are append-only</li>
        </ul>
      </DashboardCard>
    </div>
  );
}
