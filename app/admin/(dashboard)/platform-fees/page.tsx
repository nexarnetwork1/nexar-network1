import {
  getPlatformSettings,
  getLatestFeeRates,
  getFeeSchedules,
} from "@/modules/platform/repository";
import { PlatformSettingsForm } from "@/components/admin/PlatformSettingsForm";
import { FeeScheduleForm } from "@/components/admin/FeeScheduleForm";
import { PaymentMethodLogo } from "@/components/payments/PaymentMethodLogo";

export default async function AdminPlatformFeesPage() {
  const [settings, latestRates, schedules] = await Promise.all([
    getPlatformSettings(),
    getLatestFeeRates(),
    getFeeSchedules(),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Platform fees</h1>
      <p className="mt-2 text-zinc-400">Treasury and fee configuration</p>

      <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold">Treasury & tokens</h2>
        <div className="mt-4">
          <PlatformSettingsForm
            defaultValues={{
              treasuryWallet: settings?.treasury_wallet_address ?? "",
              supportEmail: settings?.support_email ?? "admin@nexarnetwork.org",
              nxrToken: settings?.nxr_token_address ?? "",
              usdtToken: settings?.usdt_token_address ?? "",
            }}
          />
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold">Current fee rates</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <Rate method="nxr" rate={latestRates.nxr} />
          <Rate method="crypto_other" rate={latestRates.crypto_other} />
          <Rate method="card" rate={latestRates.card} />
        </dl>

        <FeeScheduleForm />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Fee history</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Effective from</th>
              </tr>
            </thead>
            <tbody>
              {schedules.slice(0, 20).map((s) => (
                <tr key={s.id} className="border-b border-white/5">
                  <td className="px-4 py-3">
                    <PaymentMethodLogo method={s.payment_type} size={18} />
                  </td>
                  <td className="px-4 py-3">{(Number(s.base_rate) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(s.effective_from).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Rate({ method, rate }: { method: string; rate?: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
      <dt className="text-xs text-zinc-500">
        <PaymentMethodLogo method={method} size={18} />
      </dt>
      <dd className="mt-1 text-xl font-bold">
        {rate != null ? `${(rate * 100).toFixed(2)}%` : "—"}
      </dd>
    </div>
  );
}
