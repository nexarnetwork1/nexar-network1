import {
  getPlatformSettings,
  getFeeSchedules,
  getLatestFeeRates,
} from "@/modules/platform/repository";
import { ComprehensivePlatformSettingsForm } from "@/components/admin/ComprehensivePlatformSettingsForm";

export default async function AdminSettingsPage() {
  const [settings, feeSchedules, latestFees] = await Promise.all([
    getPlatformSettings(),
    getFeeSchedules(),
    getLatestFeeRates(),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Platform Settings</h1>
      <p className="mt-2 text-zinc-400">
        Super Admin only — treasury, fees, security, payments, and notifications
      </p>

      <div className="mt-8">
        <ComprehensivePlatformSettingsForm
          settings={settings}
          latestFees={latestFees}
        />
      </div>
    </div>
  );
}
