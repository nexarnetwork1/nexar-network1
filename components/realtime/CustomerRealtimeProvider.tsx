import { getCurrentProfile } from "@/modules/users/repository";
import { getUserWallets } from "@/modules/wallet/repository";
import { getUnreadNotificationCount } from "@/modules/notifications/repository";
import { RealtimeScope } from "@/components/realtime/RealtimeScope";

export async function CustomerRealtimeProvider({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) return children;

  const wallets = await getUserWallets("customer", profile.id);
  const primaryWallet = wallets.find((w) => w.is_primary) ?? wallets[0];
  const unreadCount = await getUnreadNotificationCount(profile.id);

  return (
    <>
      <RealtimeScope
        userId={profile.id}
        customerId={profile.id}
        walletId={primaryWallet?.id}
        initialUnreadCount={unreadCount}
      />
      {children}
    </>
  );
}
