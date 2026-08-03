import { TrendingUp } from "lucide-react";
import { getExchangeRates, getActiveSupportedCurrencies } from "@/modules/platform/repository";
import { ExchangeRateForm } from "@/components/admin/ExchangeRateForm";
import { formatDateTime } from "@/utils/format";
import { CurrencyLogo } from "@/components/payments/CurrencyLogo";
import { UsdAmount } from "@/components/payments/CurrencyAmount";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardTable,
  DashboardTableBody,
  DashboardTableCell,
  DashboardTableEmpty,
  DashboardTableHead,
  DashboardTableHeader,
  DashboardTableRow,
} from "@/components/dashboard";

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

  const latestRates = Object.values(latestByAsset);

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Exchange rates"
        headingClassName="text-gold"
        description="Crypto to USD conversion rates for payments"
      />

      <ul className="flex flex-wrap gap-2" aria-label="Active currencies">
        {currencies.map((c) => (
          <li
            key={c.id}
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-white/80"
          >
            <CurrencyLogo code={c.code} size={14} showLabel />
            <span>· {c.kind}</span>
          </li>
        ))}
      </ul>

      <DashboardSection title="Update rate" level="h3">
        <ExchangeRateForm
          currencies={currencies.map((c) => ({ code: c.code, kind: c.kind }))}
        />
      </DashboardSection>

      <DashboardSection title="Latest rates" level="h3">
        <DashboardCard flush className="overflow-hidden">
          <DashboardTable caption="Latest exchange rate per asset" minWidth="38rem">
            <DashboardTableHead>
              <DashboardTableRow>
                <DashboardTableHeader>Asset</DashboardTableHeader>
                <DashboardTableHeader>Rate (USD)</DashboardTableHeader>
                <DashboardTableHeader hideBelow="md">Source</DashboardTableHeader>
                <DashboardTableHeader hideBelow="sm">Updated</DashboardTableHeader>
              </DashboardTableRow>
            </DashboardTableHead>
            <DashboardTableBody>
              {latestRates.length === 0 ? (
                <DashboardTableEmpty colSpan={4}>
                  <DashboardEmptyState
                    inset
                    icon={<TrendingUp className="h-5 w-5" aria-hidden />}
                    title="No exchange rates yet"
                    description="Publish a rate above and the latest value per asset will appear here."
                  />
                </DashboardTableEmpty>
              ) : (
                latestRates.map((r) => (
                  <DashboardTableRow key={r.id} interactive>
                    <DashboardTableCell className="font-medium">
                      <CurrencyLogo code={r.base_currency} size={18} showLabel />
                    </DashboardTableCell>
                    <DashboardTableCell>
                      <UsdAmount amount={Number(r.rate)} size={16} />
                    </DashboardTableCell>
                    <DashboardTableCell hideBelow="md" className="text-muted">
                      {r.source}
                    </DashboardTableCell>
                    <DashboardTableCell hideBelow="sm" className="text-muted">
                      {formatDateTime(r.fetched_at)}
                    </DashboardTableCell>
                  </DashboardTableRow>
                ))
              )}
            </DashboardTableBody>
          </DashboardTable>
        </DashboardCard>
      </DashboardSection>
    </div>
  );
}
