import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/modules/stores/repository";
import { getCurrentProfile } from "@/modules/users/repository";

type Props = { params: Promise<{ slug: string }> };

export default async function PaymentsOnlyStorePage({ params }: Props) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) notFound();

  const profile = await getCurrentProfile();

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      {store.logo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={store.logo_url}
          alt=""
          className="mx-auto h-20 w-20 rounded-2xl object-cover"
        />
      )}
      <h1 className="mt-6 font-heading text-3xl font-semibold">{store.name}</h1>
      <p className="mt-2 text-muted">Payments-only merchant</p>
      <p className="mt-6 text-sm text-muted">
        Pay invoices sent by this merchant or sign in to view your pending payments.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        {profile ? (
          <Link
            href="/customer/invoices"
            className="rounded-xl bg-gold px-6 py-3 text-sm font-medium text-background"
          >
            My invoices
          </Link>
        ) : (
          <Link
            href={`/login?redirect=${encodeURIComponent(`/pay/s/${slug}`)}`}
            className="rounded-xl bg-gold px-6 py-3 text-sm font-medium text-background"
          >
            Sign in to pay
          </Link>
        )}
      </div>
    </div>
  );
}
