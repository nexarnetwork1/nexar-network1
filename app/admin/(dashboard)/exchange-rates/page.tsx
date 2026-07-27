import { getExchangeRates } from "@/modules/platform/repository";
import { ExchangeRateForm } from "@/components/admin/ExchangeRateForm";
import { formatDateTime } from "@/utils/format";

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

      <div className="mt-8">
        <ExchangeRateForm />
      </div>

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
                  {formatDateTime(r.fetched_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
