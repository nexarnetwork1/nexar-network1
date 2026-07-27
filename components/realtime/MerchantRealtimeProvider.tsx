import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getUserWallets } from "@/modules/wallet/repository";
import { getUnreadNotificationCount } from "@/modules/notifications/repository";
import { RealtimeScope } from "@/components/realtime/RealtimeScope";

export async function MerchantRealtimeProvider({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) return children;

  const store = await getMerchantStore(profile.id);
  const wallets = await getUserWallets("merchant", profile.id);
  const primaryWallet = wallets.find((w) => w.is_primary) ?? wallets[0];
  const unreadCount = await getUnreadNotificationCount(profile.id);

  return (
    <>
      <RealtimeScope
        userId={profile.id}
        storeId={store?.id}
        walletId={primaryWallet?.id}
        initialUnreadCount={unreadCount}
      />
      {children}
    </>
  );
}
