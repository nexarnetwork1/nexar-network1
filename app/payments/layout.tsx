import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments | Nexar Network",
  description: "Manage your payment methods and transaction history.",
};

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
