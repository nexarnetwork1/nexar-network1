import { History } from "lucide-react";
import {
  getPlatformSettings,
  getLatestFeeRates,
  getFeeSchedules,
} from "@/modules/platform/repository";
import { PlatformSettingsForm } from "@/components/admin/PlatformSettingsForm";
import { FeeScheduleForm } from "@/components/admin/FeeScheduleForm";
import { PaymentMethodLogo } from "@/components/payments/PaymentMethodLogo";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardStat,
  DashboardStats,
  DashboardTable,
  DashboardTableBody,
  DashboardTableCell,
  DashboardTableEmpty,
  DashboardTableHead,
  DashboardTableHeader,
  DashboardTableRow,
} from "@/components/dashboard";

export default async function AdminPlatformFeesPage() {
  const [settings, latestRates, schedules] = await Promise.all([
    getPlatformSettings(),
    getLatestFeeRates(),
    getFeeSchedules(),
  ]);

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Platform fees"
        headingClassName="text-gold"
        description="Treasury and fee configuration"
      />

      <DashboardSection title="Treasury & tokens" level="h3">
        <DashboardCard>
          <PlatformSettingsForm
            defaultValues={{
              treasuryWallet: settings?.treasury_wallet_address ?? "",
              supportEmail: settings?.support_email ?? "admin@nexarnetwork.org",
              nxrToken: settings?.nxr_token_address ?? "",
              usdtToken: settings?.usdt_token_address ?? "",
            }}
          />
        </DashboardCard>
      </DashboardSection>

      <DashboardSection title="Current fee rates" level="h3">
        <div className="space-y-4">
          <DashboardStats columns={3}>
            <DashboardStat
              label={<PaymentMethodLogo method="nxr" size={18} />}
              value={latestRates.nxr != null ? `${(latestRates.nxr * 100).toFixed(2)}%` : "—"}
            />
            <DashboardStat
              label={<PaymentMethodLogo method="crypto_other" size={18} />}
              value={
                latestRates.crypto_other != null
                  ? `${(latestRates.crypto_other * 100).toFixed(2)}%`
                  : "—"
              }
            />
            <DashboardStat
              label={<PaymentMethodLogo method="card" size={18} />}
              value={latestRates.card != null ? `${(latestRates.card * 100).toFixed(2)}%` : "—"}
            />
          </DashboardStats>

          <DashboardCard>
            <FeeScheduleForm />
          </DashboardCard>
        </div>
      </DashboardSection>

      <DashboardSection title="Fee history" level="h3">
        <DashboardCard flush className="overflow-hidden">
          <DashboardTable caption="Platform fee schedule history" minWidth="36rem">
            <DashboardTableHead>
              <DashboardTableRow>
                <DashboardTableHeader>Type</DashboardTableHeader>
                <DashboardTableHeader>Rate</DashboardTableHeader>
                <DashboardTableHeader hideBelow="sm">Effective from</DashboardTableHeader>
              </DashboardTableRow>
            </DashboardTableHead>
            <DashboardTableBody>
              {schedules.length === 0 ? (
                <DashboardTableEmpty colSpan={3}>
                  <DashboardEmptyState
                    inset
                    icon={<History className="h-5 w-5" aria-hidden />}
                    title="No fee schedules yet"
                    description="Every rate change you publish is recorded here with its effective date."
                  />
                </DashboardTableEmpty>
              ) : (
                schedules.slice(0, 20).map((s) => (
                  <DashboardTableRow key={s.id} interactive>
                    <DashboardTableCell>
                      <PaymentMethodLogo method={s.payment_type} size={18} />
                    </DashboardTableCell>
                    <DashboardTableCell>{(Number(s.base_rate) * 100).toFixed(2)}%</DashboardTableCell>
                    <DashboardTableCell hideBelow="sm" className="text-muted">
                      {new Date(s.effective_from).toLocaleString()}
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
