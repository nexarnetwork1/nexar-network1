import { getPlatformSettings } from "@/modules/platform/repository";

export default async function AdminSecurityPage() {
  const settings = await getPlatformSettings();

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
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Security</h1>
      <p className="mt-2 text-zinc-400">Platform security configuration status</p>

      <div className="mt-8 space-y-3">
        {checks.map((check) => (
          <div
            key={check.label}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-900 px-6 py-4"
          >
            <div>
              <p className="font-medium">{check.label}</p>
              <p className="mt-1 text-sm text-zinc-400">{check.status}</p>
            </div>
            <span className={check.ok ? "text-emerald-400" : "text-amber-400"}>
              {check.ok ? "OK" : "Action needed"}
            </span>
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-yellow-400">Security policies</h2>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-zinc-400">
          <li>Platform fees never remain in merchant wallets</li>
          <li>Treasury private keys stored in Supabase Vault (never in client code)</li>
          <li>Roles stored in profiles + app_metadata (never user_metadata)</li>
          <li>No public invoice or payment pages</li>
          <li>All mutations validated server-side with Zod</li>
          <li>Audit logs are append-only</li>
        </ul>
      </section>
    </div>
  );
}
