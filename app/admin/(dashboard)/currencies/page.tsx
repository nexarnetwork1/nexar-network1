import { Coins } from "lucide-react";
import { getSupportedCurrencies } from "@/modules/platform/repository";
import { toggleCurrencyAction } from "@/modules/platform/actions";
import { CurrencyLogo } from "@/components/payments/CurrencyLogo";
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
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Supported currencies"
        headingClassName="text-gold"
        description="Enable or disable currencies without code changes"
      />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="Supported currencies" minWidth="44rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Code</DashboardTableHeader>
              <DashboardTableHeader>Name</DashboardTableHeader>
              <DashboardTableHeader hideBelow="md">Kind</DashboardTableHeader>
              <DashboardTableHeader hideBelow="md">Decimals</DashboardTableHeader>
              <DashboardTableHeader>Status</DashboardTableHeader>
              <DashboardTableHeader align="right">Actions</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {currencies.length === 0 ? (
              <DashboardTableEmpty colSpan={6}>
                <DashboardEmptyState
                  inset
                  icon={<Coins className="h-5 w-5" aria-hidden />}
                  title="No currencies configured"
                  description="Currencies added to the platform will be listed here for you to enable."
                />
              </DashboardTableEmpty>
            ) : (
              currencies.map((currency) => (
                <DashboardTableRow key={currency.id} interactive>
                  <DashboardTableCell className="font-mono font-medium">
                    <span className="inline-flex items-center gap-2">
                      <CurrencyLogo code={currency.code} size={18} showLabel />
                    </span>
                  </DashboardTableCell>
                  <DashboardTableCell wrap>{currency.name}</DashboardTableCell>
                  <DashboardTableCell hideBelow="md" className="capitalize">
                    {currency.kind}
                  </DashboardTableCell>
                  <DashboardTableCell hideBelow="md">{currency.decimals}</DashboardTableCell>
                  <DashboardTableCell>
                    {currency.is_active ? (
                      <span className="text-success">Enabled</span>
                    ) : (
                      <span className="text-muted">Disabled</span>
                    )}
                  </DashboardTableCell>
                  <DashboardTableCell align="right">
                    <form action={toggleFormAction} className="flex justify-end">
                      <input type="hidden" name="currencyId" value={currency.id} />
                      <input type="hidden" name="isActive" value={currency.is_active ? "false" : "true"} />
                      <button
                        type="submit"
                        aria-label={`${currency.is_active ? "Disable" : "Enable"} ${currency.code}`}
                        className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-medium text-gold transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                      >
                        {currency.is_active ? "Disable" : "Enable"}
                      </button>
                    </form>
                  </DashboardTableCell>
                </DashboardTableRow>
              ))
            )}
          </DashboardTableBody>
        </DashboardTable>
      </DashboardCard>
    </div>
  );
}
