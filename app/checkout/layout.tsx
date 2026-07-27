import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | Nexar Network",
  description: "Professional payment experience for businesses.",
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
