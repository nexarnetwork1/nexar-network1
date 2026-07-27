import { getSupportedCurrencies } from "@/modules/platform/repository";
import { toggleCurrencyAction } from "@/modules/platform/actions";
import { CurrencyLogo } from "@/components/payments/CurrencyLogo";

async function toggleFormAction(formData: FormData) {
  "use server";
  await toggleCurrencyAction(
    formData.get("currencyId") as string,
    formData.get("isActive") === "true"
  );
}

export default async function AdminCurrenciesPage() {
  const currencies = await getSupportedCurrencies();

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Supported currencies</h1>
      <p className="mt-2 text-zinc-400">Enable or disable currencies without code changes</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Kind</th>
              <th className="px-4 py-3">Decimals</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map((currency) => (
              <tr key={currency.id} className="border-b border-white/5">
                <td className="px-4 py-3 font-mono font-medium">
                  <span className="inline-flex items-center gap-2">
                    <CurrencyLogo code={currency.code} size={18} showLabel />
                  </span>
                </td>
                <td className="px-4 py-3">{currency.name}</td>
                <td className="px-4 py-3 capitalize">{currency.kind}</td>
                <td className="px-4 py-3">{currency.decimals}</td>
                <td className="px-4 py-3">
                  {currency.is_active ? (
                    <span className="text-emerald-400">Enabled</span>
                  ) : (
                    <span className="text-zinc-500">Disabled</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <form action={toggleFormAction}>
                    <input type="hidden" name="currencyId" value={currency.id} />
                    <input type="hidden" name="isActive" value={currency.is_active ? "false" : "true"} />
                    <button type="submit" className="text-xs text-yellow-400 hover:underline">
                      {currency.is_active ? "Disable" : "Enable"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
