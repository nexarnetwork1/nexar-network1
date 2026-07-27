import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getStoreWebhooks } from "@/modules/webhooks/repository";
import { createWebhookFormAction } from "@/modules/webhooks/actions";
import { Button } from "@/components/ui/Button";

export default async function MerchantWebhooksPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const store = await getMerchantStore(profile.id);
  if (!store) return <p className="text-muted">No store found.</p>;

  const webhooks = await getStoreWebhooks(store.id);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Webhooks</h1>
      <p className="mt-2 text-muted">Receive secure event notifications for {store.name}.</p>

      <form action={createWebhookFormAction} className="mt-8 max-w-lg space-y-4 rounded-xl border border-border p-6">
        <input type="hidden" name="storeId" value={store.id} />
        <input name="url" type="url" placeholder="https://your-server.com/webhooks/nexar" required className="w-full rounded-lg border border-border bg-surface px-3 py-2" />
        <input name="events" placeholder="payment.success,order.created,invoice.paid" defaultValue="payment.success,payment.failure,refund,order.created,invoice.paid" required className="w-full rounded-lg border border-border bg-surface px-3 py-2" />
        <Button type="submit">Add webhook</Button>
      </form>

      <div className="mt-8 space-y-3">
        {webhooks.map((w) => (
          <div key={w.id} className="rounded-xl border border-border p-4">
            <p className="font-mono text-sm text-white">{w.url}</p>
            <p className="mt-1 text-xs text-muted">Prefix: {w.secret_prefix}… · Events: {w.events.join(", ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
