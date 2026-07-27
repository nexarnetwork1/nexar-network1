import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mobile App | Nexar Network",
  description: "Native iOS and Android applications for on-the-go payment management.",
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
