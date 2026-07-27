import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merchant Portal | Nexar Network",
  description: "Accept payments and manage your business with Nexar Network's merchant portal.",
};

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
