import {
  getPlatformSettings,
  getLatestFeeRates,
  getFeeSchedules,
} from "@/modules/platform/repository";
import {
  updatePlatformSettingsAction,
  updateFeeScheduleAction,
} from "@/modules/platform/actions";

async function updateSettingsFormAction(formData: FormData) {
  "use server";
  await updatePlatformSettingsAction(formData);
}

async function updateFeeFormAction(formData: FormData) {
  "use server";
  const type = formData.get("paymentType") as string;
  const rate = Number(formData.get("baseRate"));
  await updateFeeScheduleAction(type, rate);
}

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
        <form action={updateSettingsFormAction} className="mt-4 max-w-xl space-y-4">
          <Field
            label="Treasury wallet address"
            name="treasuryWallet"
            defaultValue={settings?.treasury_wallet_address ?? ""}
          />
          <Field
            label="Support email"
            name="supportEmail"
            defaultValue={settings?.support_email ?? "admin@nexarnetwork.org"}
          />
          <Field
            label="NXR token address"
            name="nxrToken"
            defaultValue={settings?.nxr_token_address ?? ""}
          />
          <Field
            label="USDT token address"
            name="usdtToken"
            defaultValue={settings?.usdt_token_address ?? ""}
          />
          <button
            type="submit"
            className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black"
          >
            Save settings
          </button>
        </form>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold">Current fee rates</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <Rate label="NXR" rate={latestRates.nxr} />
          <Rate label="Other crypto" rate={latestRates.crypto_other} />
          <Rate label="Cards" rate={latestRates.card} />
        </dl>

        <form action={updateFeeFormAction} className="mt-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-zinc-400">Type</label>
            <select
              name="paymentType"
              className="mt-1 block rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
            >
              <option value="nxr">NXR</option>
              <option value="crypto_other">Other crypto</option>
              <option value="card">Card</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400">Base rate (e.g. 0.035 = 3.5%)</label>
            <input
              name="baseRate"
              type="number"
              step="0.001"
              min="0"
              max="1"
              required
              className="mt-1 block rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-400"
          >
            Add fee schedule
          </button>
        </form>
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
                  <td className="px-4 py-3">{s.payment_type}</td>
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

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-400">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
      />
    </div>
  );
}

function Rate({ label, rate }: { label: string; rate?: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950 p-4">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-1 text-xl font-bold">
        {rate != null ? `${(rate * 100).toFixed(2)}%` : "—"}
      </dd>
    </div>
  );
}
