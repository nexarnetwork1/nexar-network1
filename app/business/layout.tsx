import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Hub - Nexar Network",
  description: "Enterprise-grade payment infrastructure for the digital economy. Fast, secure, and transparent payment solutions.",
};

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
