import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscriptions | Nexar Network",
  description: "Recurring billing and subscription management platform for SaaS businesses.",
};

export default function SubscriptionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
