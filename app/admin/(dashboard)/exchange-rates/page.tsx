import { getExchangeRates } from "@/modules/platform/repository";
import { updateExchangeRateAction } from "@/modules/platform/actions";

async function updateRateFormAction(formData: FormData) {
  "use server";
  await updateExchangeRateAction(formData);
}

export default async function AdminExchangeRatesPage() {
  const rates = await getExchangeRates();

  const latestByAsset: Record<string, typeof rates[0]> = {};
  for (const r of rates) {
    if (!latestByAsset[r.base_currency]) {
      latestByAsset[r.base_currency] = r;
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Exchange rates</h1>
      <p className="mt-2 text-zinc-400">Crypto to USD conversion rates for payments</p>

      <form
        action={updateRateFormAction}
        className="mt-8 flex flex-wrap items-end gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-6"
      >
        <div>
          <label className="text-xs text-zinc-400">Asset</label>
          <select
            name="baseCurrency"
            className="mt-1 block rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
          >
            <option value="BNB">BNB</option>
            <option value="NXR">NXR</option>
            <option value="USDT">USDT</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-400">Rate (USD per 1 unit)</label>
          <input
            name="rate"
            type="number"
            step="0.000001"
            min="0"
            required
            placeholder="600.00"
            className="mt-1 block rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black"
        >
          Update rate
        </button>
      </form>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Rate (USD)</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(latestByAsset).map((r) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="px-4 py-3 font-medium">{r.base_currency}</td>
                <td className="px-4 py-3">${Number(r.rate).toFixed(6)}</td>
                <td className="px-4 py-3 text-zinc-400">{r.source}</td>
                <td className="px-4 py-3 text-zinc-400">
                  {new Date(r.fetched_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
