import {
  getPlatformSettings,
  getFeeSchedules,
  getLatestFeeRates,
} from "@/modules/platform/repository";
import { ComprehensivePlatformSettingsForm } from "@/components/admin/ComprehensivePlatformSettingsForm";
import { DashboardSection } from "@/components/dashboard";

export default async function AdminSettingsPage() {
  const [settings, feeSchedules, latestFees] = await Promise.all([
    getPlatformSettings(),
    getFeeSchedules(),
    getLatestFeeRates(),
  ]);

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Platform settings"
        headingClassName="text-gold"
        description="Super Admin only — treasury, fees, security, payments, and notifications"
      />

      <ComprehensivePlatformSettingsForm
        settings={settings}
        latestFees={latestFees}
      />
    </div>
  );
}
