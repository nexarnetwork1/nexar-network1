import { getExchangeRates, getActiveSupportedCurrencies } from "@/modules/platform/repository";
import { ExchangeRateForm } from "@/components/admin/ExchangeRateForm";
import { formatDateTime } from "@/utils/format";
import { CurrencyLogo } from "@/components/payments/CurrencyLogo";
import { UsdAmount } from "@/components/payments/CurrencyAmount";

export default async function AdminExchangeRatesPage() {
  const [rates, currencies] = await Promise.all([
    getExchangeRates(),
    getActiveSupportedCurrencies(),
  ]);

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

      <div className="mt-6 flex flex-wrap gap-2">
        {currencies.map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300"
          >
            <CurrencyLogo code={c.code} size={14} showLabel />
            <span>· {c.kind}</span>
          </span>
        ))}
      </div>

      <div className="mt-8">
        <ExchangeRateForm
          currencies={currencies.map((c) => ({ code: c.code, kind: c.kind }))}
        />
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
                <td className="px-4 py-3 font-medium">
                  <CurrencyLogo code={r.base_currency} size={18} showLabel />
                </td>
                <td className="px-4 py-3">
                  <UsdAmount amount={Number(r.rate)} size={16} />
                </td>
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
